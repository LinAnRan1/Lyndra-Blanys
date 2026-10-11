import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const projectRoot = resolve(dirname(scriptPath), '..')
const sourcePath = resolve(projectRoot, 'src/assets/wasm')
const targetPath = resolve(projectRoot, 'lib/assets/wasm')

await mkdir(targetPath, { recursive: true })
await cp(sourcePath, targetPath, { recursive: true, force: true })