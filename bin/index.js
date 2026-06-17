#!/usr/bin/env node

import { Command } from 'commander'

import packageJson from '../package.json' with { type: 'json' }
import actions from '../src/actions/index.js'

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .usage(`[directory] [options]`)
  .argument('[directory]', 'Directory to create the project in.')
  .helpOption('-h, --help', 'Display this help message.')
  .option('--ts, --typescript', 'Use TypeScript.')
  .option('--js, --javascript', 'Use JavaScript.')
  .option('--view <engine>', 'View engine to use (none, ejs, pug).')
  .option('--linter <name>', 'Linter to use (none, biome, eslint).')
  .option('--test <runner>', 'Test runner to use (none, vitest).')
  .option('-g, --git', 'Initialize a git repository.')
  .option('--no-git', 'Do not initialize a git repository.')
  .option('-i, --install', 'Install dependencies.')
  .option('--no-install', 'Do not install dependencies.')
  .option('-y, --yes', 'Skip prompts and use defaults for any option not provided.')
  .action(async (directory, options, command) => {
    // Only forward git/install when the user set them explicitly, so the
    // actions can fall back to a prompt (or --yes default) otherwise.
    const explicit = (name) => (command.getOptionValueSource(name) === 'default' ? undefined : options[name])

    let language
    if (options.typescript) language = 'ts'
    if (options.javascript) language = 'js'

    try {
      await actions(directory, {
        language,
        view: options.view,
        linter: options.linter,
        test: options.test,
        git: explicit('git'),
        install: explicit('install'),
        yes: options.yes,
      })
    } catch (error) {
      // Inquirer throws this when the user aborts a prompt (e.g. Ctrl+C).
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log('\nAborted.')
      } else {
        console.error(`\n${error instanceof Error ? error.message : error}`)
      }
      process.exitCode = 1
    }
  })

program.parseAsync(process.argv)
