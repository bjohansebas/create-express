#!/usr/bin/env node

import { Command } from 'commander'

import packageJson from '../package.json' with { type: 'json' }
import actions from '../src/actions/index.js'

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .usage(`[directory] [options]`)
  .argument('[directory]')
  .helpOption('-h, --help', 'Display this help message.')
  .action((directory, options) => {
    actions(directory, options)
  })

program.parse(process.argv)
