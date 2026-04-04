#!/usr/bin/env node
/**
 * Usage: node scripts/encrypt-post.mjs <input.md> <password> [output-name]
 * Encrypts a markdown file with AES-256-GCM + PBKDF2.
 * Output is written to public/encrypted/<name>.enc
 * The original plaintext file is NOT modified or deleted automatically.
 */
import { randomBytes, pbkdf2Sync, createCipheriv } from 'crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')

const [,, inputFile, password, outputName] = process.argv
if (!inputFile || !password) {
  console.error('Usage: node scripts/encrypt-post.mjs <input.md> <password> [output-name]')
  process.exit(1)
}

const plaintext = readFileSync(resolve(inputFile), 'utf-8')
const salt = randomBytes(16)
const iv = randomBytes(12)
const key = pbkdf2Sync(password, salt, 100_000, 32, 'sha256')

const cipher = createCipheriv('aes-256-gcm', key, iv)
const ct1 = cipher.update(plaintext, 'utf-8')
const ct2 = cipher.final()
cipher.getAuthTag()

const ciphertext = Buffer.concat([ct1, ct2])
const authTag = cipher.getAuthTag()

const payload = JSON.stringify({
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  authTag: authTag.toString('base64'),
  ciphertext: ciphertext.toString('base64'),
})

const name = outputName ?? basename(inputFile, '.md')
const outDir = resolve(root, 'public/encrypted')
mkdirSync(outDir, { recursive: true })
const outPath = resolve(outDir, name + '.enc')
writeFileSync(outPath, payload)
console.log(`✓ Encrypted → ${outPath}`)
