/* Lyndrā-Blanys: builds the CommonJS entry (lib/cjs/index.cjs) from the compiled ESM in lib/.
 * ESM-only dependencies (p-queue, @cacheable/node-cache, whatsapp-rust-bridge) are bundled in so
 * `require('lyndra-blanys')` also works on Node versions that cannot require() ES modules.
 * CommonJS and optional dependencies stay external and are loaded from node_modules as usual. */
import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const BUNDLED = new Set(['p-queue', '@cacheable/node-cache', 'whatsapp-rust-bridge'])
const external = [
  ...Object.keys(pkg.dependencies).filter(name => !BUNDLED.has(name)),
  ...Object.keys(pkg.peerDependencies ?? {}),
  'music-metadata'
]

// VoIP files locate their sibling assets and worker through import.meta.url; keep them pointing at lib/VoIP
const voipImportMeta = {
  name: 'voip-import-meta',
  setup(b) {
    b.onLoad({ filter: /[\\/]lib[\\/]VoIP[\\/][^\\/]+\.js$/ }, args => {
      const file = args.path.split(/[\\/]/).pop()
      const source = readFileSync(args.path, 'utf8')
      if (!source.includes('import.meta.url')) return null
      const url = `require('node:url').pathToFileURL(require('node:path').join(__dirname, '..', 'VoIP', ${JSON.stringify(file)})).href`
      return { contents: source.replaceAll('import.meta.url', `(${url})`), loader: 'js' }
    })
  }
}

mkdirSync(join(root, 'lib', 'cjs'), { recursive: true })
await build({
  entryPoints: [join(root, 'lib', 'index.js')],
  outfile: join(root, 'lib', 'cjs', 'index.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external,
  plugins: [voipImportMeta],
  logLevel: 'error',
  legalComments: 'none',
  footer: {
    js: `
// Lyndrā-Blanys: make require() return the socket factory with every named export attached,
// and keep { default, __esModule } so both styles work:
//   const makeWASocket = require('lyndra-blanys')
//   const { default: makeWASocket, useMultiFileAuthState } = require('lyndra-blanys')
;(() => {
  const ns = module.exports
  const factory = function makeWASocket(...args) { return ns.default.apply(this, args) }
  for (const key of Object.keys(ns)) {
    if (key === 'name' || key === 'length' || key === 'prototype') continue
    Object.defineProperty(factory, key, { enumerable: true, configurable: true, get: () => ns[key] })
  }
  Object.defineProperty(factory, '__esModule', { value: true })
  module.exports = factory
})()
`
  }
})

writeFileSync(
  join(root, 'lib', 'cjs', 'index.d.cts'),
  `// Lyndrā-Blanys: types for require(). Runtime: require('lyndra-blanys') is the socket factory with every export attached.
export * from '../index.js'
export { default } from '../index.js'
`
)
console.log('cjs build ok')
