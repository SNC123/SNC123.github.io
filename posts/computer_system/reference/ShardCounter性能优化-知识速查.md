# ShardCounter 性能优化 — 知识速查

> [!WARNING] 本文档由LLM生成，未经核查，可能出现事实错误

本文汇总了 [ShardCounter 性能优化](/posts/computer_system/notes/ShardCounter性能优化) 一文中涉及的核心知识点，供快速查阅。

[[toc]]

## CPU 缓存体系

### Cache Line（缓存行）

现代 CPU 不以字节为单位读写内存，而是以**缓存行（Cache Line）**为单位，通常为 **64 字节**。

当 CPU 读取内存中某个变量时，整条包含该变量的缓存行都会被载入 L1/L2/L3 缓存。写入同理。

```
内存地址          缓存行（64 字节）
┌────────────────────────────────────────────────────────────────┐
│  var_a (8B)  │  var_b (8B)  │  padding (48B)                   │
└────────────────────────────────────────────────────────────────┘
                ↑ 两个变量共享同一缓存行 → 潜在 False Sharing
```

**在 C++ 中对齐到缓存行大小：**
```cpp
struct alignas(64) Slot {
    std::atomic<int64_t> value{0};
    // 编译器自动填充 56 字节 padding，使 sizeof(Slot) == 64
};
static_assert(sizeof(Slot) == 64);
```

`alignas(64)` 保证每个 `Slot` 独占一条 Cache Line，彻底消除跨核争用。

---

### False Sharing（伪共享）

**现象**：两个变量逻辑上相互独立，但物理上位于同一条缓存行，导致多核并发写入时产生不必要的性能损耗。

**原理**：当核心 A 写入变量 `x`，核心 B 写入变量 `y`，哪怕 `x` 和 `y` 毫无关联，只要它们在同一缓存行内，MESI 协议就会强制两个核心的缓存行反复 Invalidate → 重新加载，造成缓存行在各核心之间"弹跳"。

```
Core 0 写 x → 缓存行 Modified → Core 1 的缓存行 Invalid
Core 1 写 y → 需要先从内存/LLC 重新加载 → 再 Modified
...（反复弹跳）
```

**诊断工具**：
- Linux `perf stat -e cache-misses`
- Intel VTune 的 Memory Access 分析

**解决方法**：
1. 用 `alignas(64)` 将热点变量对齐到独立缓存行
2. 将频繁被不同线程写入的变量分配到不同的内存区域

---

### MESI 协议

MESI 是多核 CPU 保证**缓存一致性**的协议，每条缓存行处于四种状态之一：

| 状态 | 含义 |
|------|------|
| **M**odified | 本核已修改，与内存不一致，其他核无副本 |
| **E**xclusive | 本核独占，与内存一致，其他核无副本 |
| **S**hared | 多个核持有相同副本，与内存一致 |
| **I**nvalid | 缓存行无效，需重新加载 |

**多核写同一缓存行的状态转换：**

```
初始：Core 0 持有 S 态缓存行
Core 0 写入 → 发 Invalidate 广播
            → Core 1 的缓存行变为 I 态
            → Core 0 的缓存行升级为 M 态

Core 1 读取 → 发 Read 请求
           → Core 0 将 M 态缓存行写回内存
           → 两者均变为 S 态
```

核心越多，总线上的 Invalidate 广播越频繁，竞争越激烈，这正是方案一（SingleAtomic）随线程数增加吞吐反而下降的根本原因。

**延伸阅读**：[图解 CPU 缓存一致性协议 (MESI) - 小林coding](https://www.xiaolincoding.com/os/1_hardware/cpu_mesi.html)

## C++ 原子操作

### std::atomic

`std::atomic<T>` 是 C++11 引入的原子类型，保证对变量的读/写/修改操作在多线程环境中**不可被中断**，无需额外加锁。

```cpp
#include <atomic>

std::atomic<int64_t> counter{0};

counter.store(0);                              // 原子写
int64_t v = counter.load();                   // 原子读
counter.fetch_add(1);                         // 原子加（返回加之前的值）
counter.fetch_sub(1);                         // 原子减
counter.compare_exchange_strong(old, new_v);  // CAS
```

**适用场景**：单变量的无锁计数、标志位、引用计数（如 `shared_ptr` 内部）。

### memory_order（内存序）

`memory_order` 控制原子操作对周围非原子内存操作的**可见性顺序**，影响编译器和 CPU 的重排行为。

| 枚举值 | 强度 | 含义 |
|--------|------|------|
| `memory_order_relaxed` | 最弱 | 只保证原子性，不限制重排 |
| `memory_order_acquire` | 中等 | 本操作之后的读写不得重排到本操作之前 |
| `memory_order_release` | 中等 | 本操作之前的读写不得重排到本操作之后 |
| `memory_order_acq_rel` | 较强 | acquire + release 的组合 |
| `memory_order_seq_cst` | 最强 | 全局顺序一致（默认值，有额外开销） |

**计数器场景选 `relaxed` 的原因：**

`Add()` 只需保证累加本身的原子性，无需对其他内存操作建立 happens-before 关系。使用 `relaxed` 可以避免在 x86 以外的弱内存模型架构（如 ARM）上产生额外的内存屏障指令。

```cpp
void Add(int64_t n) {
    val_.fetch_add(n, std::memory_order_relaxed);  // 最大性能
}
```

> [!WARNING]
> 如果 `Get()` 的返回值会被用于做同步决策（如"计数归零则触发某操作"），则需要更强的内存序，否则可能读到过期值。

---

### LOCK XADD（x86 原子指令）

`std::atomic<int64_t>::fetch_add` 在 x86-64 平台会被编译为一条 **`LOCK XADD`** 指令。

```asm
; fetch_add(n, relaxed) 的汇编输出（x86-64 gcc）
lock xadd QWORD PTR [rdi], rsi
```

- **`XADD`**：交换并相加（eXchange and ADD），将源操作数与目标操作数相加，结果写回目标，原值写回源。
- **`LOCK` 前缀**：在执行期间锁住总线（或缓存行），保证操作的原子性。

**性能含义**：`LOCK` 前缀会触发缓存一致性协议，使持有相同缓存行的其他核心的副本无效化。这正是多核场景下 SingleAtomic 方案的吞吐瓶颈所在——所有核心都在争抢同一条缓存行的 Modified 状态。

**验证方法**（[Compiler Explorer](https://godbolt.org/)）：

```cpp
#include <atomic>
#include <cstdint>

void add(std::atomic<int64_t>& x, int64_t n) {
    x.fetch_add(n, std::memory_order_relaxed);
}
```

编译器选择 `x86-64 gcc`，优化 `-O2`，即可在右侧看到 `lock xadd` 指令。

---

### sched_getcpu()

Linux 系统调用，返回当前线程**正在运行的物理 CPU 核心编号**。

```cpp
#include <sched.h>

void Add(int64_t n) {
    int cpu = sched_getcpu();      // 0 ~ N-1
    slots_[cpu % kShards].value.fetch_add(n, std::memory_order_relaxed);
}
```

相比 `std::hash<std::thread::id>` 哈希取模，直接用 CPU 编号路由可以**完全避免同核哈希碰撞**，是方案三（CpuShard）相比方案二（HashShard）性能更好的原因。

> [!NOTE]
> 线程可能在两次调用之间被调度到不同 CPU，但对于计数器场景这不会造成正确性问题，只是偶尔会有两个线程落到同一 Slot 的小概率竞争。

## 线程局部存储（thread_local）

### 基本概念

`thread_local` 是 C++11 引入的存储类说明符，被修饰的变量**每个线程拥有独立的实例**，生命周期与所在线程绑定。

```cpp
thread_local int counter = 0;   // 每个线程各自有一份 counter

void increment() {
    counter++;   // 只写本线程自己的副本，零竞争
}
```

与其他存储期的对比：

| 存储期 | 关键字 | 生命周期 | 线程共享 |
|--------|--------|----------|----------|
| 自动（栈） | —（局部变量默认） | 函数调用期间 | 否 |
| 静态 | `static` / 全局 | 程序运行期间 | **是** |
| 线程局部 | `thread_local` | 线程运行期间 | 否 |
| 动态（堆） | `new` / `malloc` | 手动管理 | 取决于指针共享 |

---

### 底层实现

在 Linux/ELF 系统上，`thread_local` 变量存储在 **TLS（Thread Local Storage）段**，由 `%fs` 段寄存器寻址（x86-64），访问开销接近普通内存访问。

```asm
; thread_local int x 的访问汇编（x86-64）
mov eax, DWORD PTR fs:offset_of_x@tpoff
```

线程创建时，运行时为每个线程分配独立的 TLS 块；线程退出时自动释放。

---

### 使用注意事项

**静态 thread_local 的初始化**：在对应线程第一次访问时进行（惰性初始化）。

**线程退出时的析构**：`thread_local` 对象的析构函数在线程退出时自动调用，执行顺序与构造顺序相反：

```cpp
struct ThreadGuard {
    ~ThreadGuard() {
        // 线程退出时触发，可用于将本地数据汇总到全局
        global_sum.fetch_add(local_val, std::memory_order_relaxed);
    }
};

thread_local ThreadGuard guard;  // 线程退出 → 析构 → 自动汇总
```

这是 `ThreadLocalCounter` 中汇总各线程计数的核心机制。

**不适用的场景**：
- 跨线程传递：`thread_local` 变量的指针/引用不应传递给其他线程使用
- 线程池中的持久状态：工作线程不退出，`~ThreadGuard` 不会触发，需手动汇总

---

### 与锁方案的性能对比

| 方案 | 写操作开销 | 读操作开销 | 适用场景 |
|------|-----------|-----------|---------|
| `std::mutex` + 普通变量 | 高（加锁/解锁） | 高 | 通用 |
| `std::atomic` | 中（LOCK 前缀） | 低 | 单共享计数器 |
| `thread_local` | **极低**（无竞争） | 中（需遍历所有线程） | 写多读少的聚合统计 |

`thread_local` 方案的 `Add()` 操作完全不涉及原子指令和内存屏障，是用户态计数器的**吞吐天花板**，代价是 `Get()` 需要 `O(线程数)` 的遍历。
