#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.tsx?$/.test(e.name) || /\.jsx?$/.test(e.name)) {
      const content = fs.readFileSync(p, 'utf8')
      if (/dynamic\s*\(.*\,\s*\{[^}]*ssr\s*:\s*false[^}]*\}\s*\)/s.test(content)) {
        console.error('Forbidden dynamic(..., { ssr: false }) found in', p)
        process.exitCode = 2
      }
    }
  }
}

const root = path.resolve(__dirname, '..', 'src')
if (!fs.existsSync(root)) {
  console.error('src directory not found')
  process.exit(1)
}
walk(root)
if (process.exitCode) process.exit(process.exitCode)
else console.log('check-dynamic-ssr: ok')
