#!/usr/bin/env node

const { Command } = require("commander");

const packageJson = require("../package.json");
const { checkUpdates } = require("../src/utils/checkUpdates.js");

exports = program = new Command(packageJson.name)
	.version(packageJson.version)
	.usage(`[directory] [options]`)
	.argument("[directory]")
	.helpOption("-h, --help", "Display this help message.")
	.option("--ts, --typescript", "Initialize as a TypeScript project. (default)")
	.option("--js, --javascript", "Initialize as a JavaScript project.")
    .option("-t, --template <template>", "Specify a template.")
	.option("--empty", "Initialize an empty project.")
    .option('--disable-git', "Skip initializing a git repository.")
	.option(
		"--skip-install",
		"Explicitly tell the CLI to skip installing packages.",
	)
	.option(
		"--use-npm",
		"Explicitly tell the CLI to bootstrap the application using npm.",
	)
	.option(
		"--use-pnpm",
		"Explicitly tell the CLI to bootstrap the application using pnpm.",
	)
	.option(
		"--use-yarn",
		"Explicitly tell the CLI to bootstrap the application using Yarn.",
	)
	.option(
		"--use-bun",
		"Explicitly tell the CLI to bootstrap the application using Bun.",
	)
	.hook("postAction", async () => {
		await checkUpdates();
	});

program.parse(process.argv);
