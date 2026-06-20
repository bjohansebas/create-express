# @expressjs/create

Create [Express](https://expressjs.com) apps with no build configuration.

```sh
npm create @bjohansebas
```

You can also run it with your package manager of choice:

```sh
# pnpm
pnpm create @bjohansebas

# yarn
yarn create @bjohansebas

# bun
bun create @bjohansebas
```

## Usage

Running the command with no arguments starts an interactive prompt that asks for
the project location and features. You can also pass a target directory and skip
any prompt with flags:

```sh
npm create @bjohansebas@latest my-app -- --ts --view ejs --linter biome --test vitest
```

### Options

| Flag                               | Description                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `[directory]`                      | Directory to create the project in.                                                        |
| `--ts`, `--typescript`             | Use TypeScript.                                                                            |
| `--js`, `--javascript`             | Use JavaScript.                                                                            |
| `--esm` / `--cjs`                  | Module system: ES modules (default) or CommonJS.                                           |
| `--example <name>`                 | Starter example: `minimal`, `api`, `web`, `mvc`.                                           |
| `--view <engine>`                  | View engine: `none`, `ejs`, `pug`, `handlebars`.                                           |
| `--linter <name>`                  | Linter: `none`, `biome`, `oxlint`, `eslint`.                                               |
| `--test <runner>`                  | Test runner: `none`, `vitest`, `node`, `mocha`.                                            |
| `--docker` / `--no-docker`         | Add (or not) a `Dockerfile` and `.dockerignore`.                                           |
| `--pm`, `--package-manager <name>` | Package manager: `npm`, `pnpm`, `yarn`, `bun` (defaults to the one that launched the CLI). |
| `-g`, `--git` / `--no-git`         | Initialize (or not) a git repository.                                                      |
| `-i`, `--install` / `--no-install` | Install (or not) dependencies.                                                             |
| `-f`, `--force`                    | Overwrite the target directory if it is not empty (keeps `.git`).                          |
| `-y`, `--yes`                      | Skip prompts and use defaults for any option not provided.                                 |
| `-h`, `--help`                     | Display the help message.                                                                  |

Any option not provided as a flag is asked interactively, unless `--yes` is used,
in which case the defaults are applied (TypeScript, Biome, no view engine, no test
runner, git and install enabled). This makes the command safe to run in CI:

```sh
npm create express@latest my-app -- --yes --no-install --no-git
```

## Starter examples

Pick a starting point with `--example` (like Vite's templates). Each one is a
working, realistic scaffold rather than a bare hello-world:

- **`minimal`** — a single route returning `Hello, World!`.
- **`api`** — a JSON REST API: a `routes/` router with a sample resource, a
  request logger, body parsing, and a centralized 404 + error handler.
- **`web`** — a server-rendered app with a view engine, static assets and error pages.
- **`mvc`** — a layered structure (routes / controllers / services) ready to grow.

Examples compose with everything else, so `--example api --ts --linter biome
--test vitest` gives you a typed, linted, tested REST API.

## What you get

The generated project is composed from small fragments, so you only get what you
pick:

- `app.(js|ts)` — the configured Express application (exported, so it is easy to test).
- `server.(js|ts)` — boots the app and listens on `process.env.PORT` (default `3000`).
- A view engine (EJS or Pug) with a `views/` folder, when selected.
- A linter (Biome or ESLint) preconfigured to match the generated code.
- A test runner (Vitest, the built-in `node:test`, or Mocha) with a test that
  exercises the chosen example's own routes, when selected.

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
