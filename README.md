# @expressjs/create

Create [Express](https://expressjs.com) apps with no build configuration.

```sh
npm create express@latest
```

You can also run it with your package manager of choice:

```sh
# pnpm
pnpm create express

# yarn
yarn create express

# bun
bun create express
```

## Usage

Running the command with no arguments starts an interactive prompt that asks for
the project location and features. You can also pass a target directory and skip
any prompt with flags:

```sh
npm create express@latest my-app -- --ts --view ejs --linter biome --test vitest
```

### Options

| Flag | Description |
| --- | --- |
| `[directory]` | Directory to create the project in. |
| `--ts`, `--typescript` | Use TypeScript. |
| `--js`, `--javascript` | Use JavaScript. |
| `--view <engine>` | View engine: `none`, `ejs`, `pug`. |
| `--linter <name>` | Linter: `none`, `biome`, `eslint`. |
| `--test <runner>` | Test runner: `none`, `vitest`. |
| `-g`, `--git` / `--no-git` | Initialize (or not) a git repository. |
| `-i`, `--install` / `--no-install` | Install (or not) dependencies. |
| `-y`, `--yes` | Skip prompts and use defaults for any option not provided. |
| `-h`, `--help` | Display the help message. |

Any option not provided as a flag is asked interactively, unless `--yes` is used,
in which case the defaults are applied (TypeScript, Biome, no view engine, no test
runner, git and install enabled). This makes the command safe to run in CI:

```sh
npm create express@latest my-app -- --yes --no-install --no-git
```

## What you get

The generated project is composed from small fragments, so you only get what you
pick:

- `app.(js|ts)` — the configured Express application (exported, so it is easy to test).
- `server.(js|ts)` — boots the app and listens on `process.env.PORT` (default `3000`).
- A view engine (EJS or Pug) with a `views/` folder, when selected.
- A linter (Biome or ESLint) preconfigured to match the generated code.
- A Vitest setup with a sample test, when selected.

## Contributing

```sh
pnpm install
pnpm lint
pnpm test
```

Templates live in `templates/` as composable fragments (`base`, `typescript`,
`view/*`, `linter/*`, `test/*`). The scaffolding logic lives in `src/actions`.

## License

[MIT](./LICENSE.md)
