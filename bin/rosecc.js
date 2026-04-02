#!/usr/bin/env node

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const bundledWindowsBun = resolve(
  rootDir,
  '.runtime',
  'bun',
  'windows-x64-1.3.11',
  'bin',
  'bun.exe',
)
const bunCommand =
  process.env.ROSECC_BUN_PATH ||
  (process.platform === 'win32' && existsSync(bundledWindowsBun)
    ? bundledWindowsBun
    : process.platform === 'win32'
      ? 'bun.exe'
      : 'bun')
const args = []
const cliArgs = process.argv.slice(2)

const childEnv = { ...process.env }

if (process.env.ROSECC_LOAD_DOTENV === '1') {
  args.push('--env-file=.env')
}

args.push('./src/entrypoints/rosecc.ts')
args.push(...cliArgs)

const child = spawn(bunCommand, args, {
  cwd: rootDir,
  env: childEnv,
  stdio: 'inherit',
})

child.on('error', error => {
  if ('code' in error && error.code === 'ENOENT') {
    console.error('Error: bun is not installed or not available in PATH.')
  } else {
    console.error(error)
  }
  process.exit(1)
})

child.on('exit', code => {
  process.exit(code ?? 0)
})
