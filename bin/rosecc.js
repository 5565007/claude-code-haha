#!/usr/bin/env node

import { spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
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
const args = ['--env-file=.env']
const envFilePath = resolve(rootDir, '.env')
const cliArgs = process.argv.slice(2)

function readEnvValue(name) {
  try {
    const content = readFileSync(envFilePath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith('#')) {
        continue
      }
      const index = line.indexOf('=')
      if (index === -1) {
        continue
      }
      const key = line.slice(0, index).trim()
      if (key !== name) {
        continue
      }
      return line.slice(index + 1).trim()
    }
  } catch {
    return undefined
  }

  return undefined
}

const childEnv = { ...process.env }
const routedBaseUrl =
  childEnv.ANTHROPIC_BASE_URL ?? readEnvValue('ANTHROPIC_BASE_URL')
const routedAuthToken =
  childEnv.ANTHROPIC_AUTH_TOKEN ?? readEnvValue('ANTHROPIC_AUTH_TOKEN')
const routedApiKey =
  childEnv.ANTHROPIC_API_KEY ?? readEnvValue('ANTHROPIC_API_KEY')

if (routedBaseUrl || routedAuthToken || routedApiKey) {
  // Keep routing under the launcher's control so ~/.claude/settings.json
  // cannot silently replace relay endpoint, auth, or default models.
  childEnv.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST = '1'
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
