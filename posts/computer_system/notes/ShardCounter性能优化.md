---
date: 2026-04-04
---

# ShardCounter 性能优化

## 背景

3月面试季，被要求实现一个高性能 ShardCounter
```C++
class ShardCounter {
    int Get();
    void Reset();
    void Add();
};
```
脑内一片空白，只知最基本的atomic方案，深感知识匮乏，故做学习。


## 解决方案
### 方案一：单原子变量

```C++
class SingleAtomicCounter {
public:
    void Reset() { val_.store(0, std::memory_order_relaxed); }
    void Add(int64_t n) { val_.fetch_add(n, std::memory_order_relaxed); }
    int64_t Get() const { return val_.load(std::memory_order_relaxed); }

private:
    std::atomic<int64_t> val_{0};
};
```

std::atomic<int64_t>::fetch_add 在 x86 上会被编译为一条 LOCK XADD 指令

> [!TIP] 汇编验证
> 推荐使用 https://godbolt.org/ 查看汇编代码
>
> 最小复现代码 (x86-64 gcc 12.3)
> ```C++
> #include <atomic>
> #include <cstdint>
>
> void add(int64_t n) {
>     std::atomic<int64_t> x; 
>     x.fetch_add(n, std::memory_order_relaxed);
> } 
> ```

在多核CPU编程中，存在经典的 **False Sharing / Cache Line 争用** 问题。

各个 CPU 核心都向内存中的同一个 8 字节变量写入，该变量会同时缓存在各核的L1/L2缓存中，导致反复弹跳（MESI 协议 [[1]](#MESI) 的 Invalid→Shared→Modified 状态切换）。

核数越多，总线仲裁越激烈，吞吐线性下降。

### 方案二：Cache Line 对齐 + 哈希

```C++
class HashShardCounter {
    static constexpr int kShards = 64; // 通常取 2 的幂，且 ≥ 最大线程数

    // alignas(64) 让 sizeof(Slot) == 64，每个槽独占一条 Cache Line
    struct alignas(64) Slot {
        std::atomic<int64_t> value{0};
        // 剩余 56 字节由编译器自动填充为 padding，不需要手写
    };
    static_assert(sizeof(Slot) == 64, "Slot must be exactly one cache line (64 B)");

public:
    void Add(int64_t n) {
        // 通过 std::this_thread::get_id() 路由到某个槽
        const std::size_t idx =
            std::hash<std::thread::id>{}(std::this_thread::get_id()) % kShards;
        slots_[idx].value.fetch_add(n, std::memory_order_relaxed);
    }
    /*
        Get/Reset 省略，需要 O(kShards) 遍历求和。
    */
private:
    Slot slots_[kShards];
};
```
针对方案一中的问题，我们使用空间换时间的方法，通过内存对齐的方法让计数变量尽可能分开。

CacheLine 通常是 8 字节，故 alignas 对齐到 64。

线程按自身 thread_id 哈希后取模，固定路由到某个槽。

计数器场景写远大于读，故可通过牺牲 Get/Reset 性能换取 Add 性能。

> [!TIP] CPU 哈希
> 用 thread_id 哈希分片，多个线程哈希碰撞到同一槽的概率依旧很大。
> 
> 可直接用 sched_getcpu() 获取线程当前运行的物理 CPU 编号，为每个 CPU 核心分配独立 Slot。

### 方案三：thread_local 本地变量

在 C++ 11 中引入了线程局部变量，使用 thread_local 修饰，生命周期与线程绑定。

为避免缓存行争用，我们可以使用线程局部变量。

```C++
class ThreadLocalCounter {
    // --- 1. 全局统计数据 (Shared State) ---
    atomic<int64_t> dead_sum{0};       // 各个线程退出时累计 local_val 到该变量
    vector<int64_t*> registry;         // 活跃线程的 local_val指针列表
    mutex mu;                          // 保护 registry 的全局锁

    // --- 2. 线程私有数据 (Thread-Local State) ---
    static thread_local int64_t local_val;    // 各线程的局部计数值
};
```

核心思路如下：

- 线程初始化时注册到 ThreadLocalCounter 单例，结束时将局部计数值保存到 dead_sum
- 读操作：活跃线程 local_val +  dead_sum 值
- 写操作：直接增加 local_val 值

注意使用 std:lock_guard 对 registry 进行维护。

对于 dead_sum 的维护，可设计一个 thread_local 修饰的静态 ThreadGuard [[2]](#CODE)。

```C++
    struct ThreadGuard {
        ThreadLocalCounter* owner{nullptr};
        ~ThreadGuard() { // 线程退出时触发
            owner->dead_sum.fetch_add(local_val, relaxed);
            lock_guard<mutex> lock(owner->mu);
            owner->registry.remove(&local_val);
        }
    }

    static thread_local ThreadGuard thread_guard;
```

需要额外注意 ThreadGuard 持有 ThreadLocalCounter 指针隐含的内存安全问题。

因为实验代码 Bench 中的调用方式不会出现该问题，此处简化处理。


## 实验结果
<BenchmarkChart
  title="吞吐量对比（M ops/s）"
  :labels="['1线程', '2线程', '4线程', '48线程']"
  :series="[
    { name: '方案一 SingleAtomic', color: '#e05c5c', values: [133.7, 56.6, 51.9, 43.1] },
    { name: '方案二 HashShard', color: '#f0a500', values: [76.1, 149.4, 297.3, 743.2] },
    { name: '方案二 CpuShard',     color: '#4ea8de', values: [95.0, 188.9, 338.3, 1881.3] },
    { name: '方案三 ThreadLocal',  color: '#56c26e', values: [411.7, 823.4, 1638.8, 7458.3] },
  ]"
  unit="M ops/s"
/>

1. 单Atomic方案随着线程数提高性能反而降低，缓存行争用的完美案例。
2. 分片方案消除争用效果显著，CPU分片有效但仍然同数量级。
3. 局部变量比分片方案吞吐量高一个数量级，是用户态并发计数器的吞吐天花板。


## 参考

<span id="MESI">[1] </span> [图解 CPU 缓存一致性协议 (MESI) - 小林coding](https://www.xiaolincoding.com/os/1_hardware/cpu_mesi.html)

<span id="CODE">[2] </span> [实验代码中的ThreadGuard](https://github.com/SNC123/system_curiosity/blob/main/shard_counter.cpp#L232-L244)

> [!NOTE] 知识速查 - LLM生成
> [CPU缓存、C++原子操作操作、线程局部存储](/posts/computer_system/reference/ShardCounter性能优化-知识速查)