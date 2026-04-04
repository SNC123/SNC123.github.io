<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ src: string }>()

const mounted = ref(false)
const password = ref('')
const rendered = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => { mounted.value = true })

async function unlock() {
  if (!password.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error('fetch failed')
    const { salt, iv, authTag, ciphertext } = await res.json()

    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password.value), 'PBKDF2', false, ['deriveKey']
    )
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64(salt), iterations: 100_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const ctBuf = b64(ciphertext)
    const tagBuf = b64(authTag)
    const combined = new Uint8Array(ctBuf.byteLength + tagBuf.byteLength)
    combined.set(new Uint8Array(ctBuf))
    combined.set(new Uint8Array(tagBuf), ctBuf.byteLength)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64(iv) },
      key,
      combined
    )

    const text = new TextDecoder().decode(decrypted)
    const body = text.replace(/^---[\s\S]*?---\s*\n/, '')
    rendered.value = await marked.parse(body)
  } catch {
    error.value = '密码错误，请重试'
  } finally {
    loading.value = false
  }
}

function b64(s: string): ArrayBuffer {
  const bin = atob(s)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}
</script>

<template>
  <template v-if="mounted">
    <div v-if="!rendered" class="enc-prompt">
      <div class="enc-icon">🔒</div>
      <p class="enc-hint">此页面已加密，请输入密码查看内容</p>
      <div class="enc-form">
        <input
          v-model="password"
          type="password"
          placeholder="输入密码"
          autocomplete="off"
          @keyup.enter="unlock"
        />
        <button :disabled="loading" @click="unlock">
          {{ loading ? '解密中…' : '解锁' }}
        </button>
      </div>
      <p v-if="error" class="enc-error">{{ error }}</p>
    </div>
    <div v-else class="vp-doc enc-content" v-html="rendered" />
  </template>
</template>

<style scoped>
.enc-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1rem;
  text-align: center;
}
.enc-icon { font-size: 3rem; }
.enc-hint {
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}
.enc-form {
  display: flex;
  gap: 0.5rem;
}
.enc-form input {
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  outline: none;
  width: 200px;
}
.enc-form input:focus {
  border-color: var(--vp-c-brand-1);
}
.enc-form button {
  padding: 0.45rem 1.1rem;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}
.enc-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.enc-error {
  color: var(--vp-c-danger-1);
  font-size: 0.88rem;
}
</style>
