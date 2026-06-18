#!/usr/bin/env node

import { Command } from 'commander'

import packageJson from '../package.json' with { type: 'json' }
import actions from '../src/actions/index.js'
import { formatError, resolveOptions } from '../src/cli.js'

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .usage(`[directory] [options]`)
  .argument('[directory]', 'Directory to create the project in.')
  .helpOption('-h, --help', 'Display this help message.')
  .option('--ts, --typescript', 'Use TypeScript.')
  .option('--js, --javascript', 'Use JavaScript.')
  .option('--example <name>', 'Starter example to use (minimal, api, web, mvc).')
  .option('--view <engine>', 'View engine to use (none, ejs, pug).')
  .option('--linter <name>', 'Linter to use (none, biome, eslint).')
  .option('--test <runner>', 'Test runner to use (none, vitest, node, mocha).')
  .option('-g, --git', 'Initialize a git repository.')
  .option('--no-git', 'Do not initialize a git repository.')
  .option('-i, --install', 'Install dependencies.')
  .option('--no-install', 'Do not install dependencies.')
  .option('-y, --yes', 'Skip prompts and use defaults for any option not provided.')
  .action(async (directory, options, command) => {
    try {
      await actions(
        directory,
        resolveOptions(options, (name) => command.getOptionValueSource(name)),
      )
    } catch (error) {
      const { aborted, message } = formatError(error)
      if (aborted) {
        console.log(`\n${message}`)
      } else {
        console.error(`\n${message}`)
      }
      process.exitCode = 1
    }
  })

program.parse(process.argv)
