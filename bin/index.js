#!/usr/bin/env node

import { Command } from 'commander'

import packageJson from '../package.json' with { type: 'json' }
import actions from '../src/actions/index.js'

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .usage(`[directory] [options]`)
  .argument('[directory]', 'Directory to create the project in.')
  .helpOption('-h, --help', 'Display this help message.')
  .option('-t, --template <name>', 'Template to use (minimal, minimal-typescript).')
  .option('--ts, --typescript', 'Use the TypeScript template.')
  .option('--js, --javascript', 'Use the JavaScript template.')
  .option('-g, --git', 'Initialize a git repository.')
  .option('--no-git', 'Do not initialize a git repository.')
  .option('-i, --install', 'Install dependencies.')
  .option('--no-install', 'Do not install dependencies.')
  .action((directory, options, command) => {
    // Only forward git/install when the user set them explicitly, so the
    // actions can fall back to an interactive prompt otherwise.
    const explicit = (name) => (command.getOptionValueSource(name) === 'default' ? undefined : options[name])

    actions(directory, {
      template: options.template,
      typescript: options.typescript,
      javascript: options.javascript,
      git: explicit('git'),
      install: explicit('install'),
    })
  })

program.parse(process.argv)
