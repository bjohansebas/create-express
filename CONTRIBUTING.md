# Contributing to create-express

Thanks for your interest in improving `@expressjs/create`! This guide covers the
project layout, the development workflow, and how to add new scaffolding options.

## Getting started

```sh
git clone https://github.com/bjohansebas/create-express.git
cd create-express
npm install
```

Run the CLI locally against a throwaway directory:

```sh
node bin/index.js /tmp/demo --ts --example api --no-git --no-install
```

## Scripts

| Command                 | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run lint`          | Lint and format-check with Biome.                               |
| `npm run lint:fix`      | Apply Biome fixes.                                              |
| `npm test`              | Run the unit/integration suite (`node:test`).                   |
| `npm run test:coverage` | Same, with c8 coverage (must stay at 100%).                     |
| `npm run test:e2e`      | Scaffold real projects, then run their install/lint/test/build. |

Before opening a PR, make sure `npm run lint` and `npm run test:coverage` pass.

## Project layout

```
bin/index.js          CLI entry point (commander) — flag parsing only
src/cli.js            Maps commander options to the actions input
src/actions/          The pipeline, in order:
  context.js            builds the run context
  project-name.js       resolves/validates the target directory
  select-features.js    resolves every option (flag -> --yes default -> prompt)
  compose.js            assembles the project from template fragments
  install.js, git.js, next-steps.js
src/utils/            merge (deep-merge package.json), to-cjs, node, os, package-manager
templates/            composable template fragments (see below)
test/                 unit/integration tests; test/e2e/ holds the slow e2e suite
```

## How templates work

A generated project is **composed from fragments**, not copied from one big
template. `compose.js` applies fragments in order and deep-merges each
fragment's `package.json`:

```
base -> example/<example> -> typescript? -> view/<engine>? -> linter/<linter>? -> test/<runner>? -> docker?
```

Key mechanics in `compose.js`:

- **Language consolidation** — a TS project drops every `.js` that has a `.ts`
  sibling; a JS project drops all `.ts`/`tsconfig.json`.
- **CommonJS** — `src/utils/to-cjs.js` rewrites sources (`import`→`require`,
  `import.meta.url`→`__dirname`, …); tsconfig/`type` are adjusted.
- **Selection steps** — `selectExampleTest`, `selectEslintConfig`,
  `pruneViewTemplates` keep only the variant matching the chosen options.
- `@types/*` and `typescript-eslint` are stripped from JavaScript projects.

Views and static assets use **cwd-relative paths** (`app.set('views', 'views')`)
so they work in dev, tests, and a built `dist/`. All templates are LF-only
(enforced by `.gitattributes`).

## Adding a new option

- **View engine** — add `templates/view/<name>/` (a `views.(js|ts)` `setupViews`
  hook + `views/*` templates + `package.json` with the engine dep), then add it
  to `VIEWS`/`WEB_VIEWS` in `select-features.js`, `VIEW_EXTENSIONS` in
  `compose.js`, the `--view` help in `bin/index.js`, and the README.
- **Linter** — add `templates/linter/<name>/`, then `LINTERS` + help + README.
- **Test runner** — add `templates/test/<name>/` with a `package.json` and a
  `tests/<example>.test.{js,ts}` for **every** example, then `TESTS` + help. The
  guard test in `test/templates.test.js` enforces full coverage of the matrix.
- **Example** — add `templates/example/<name>/` (it owns `app.(js|ts)`), add it
  to `EXAMPLES`, and add a `<name>.test.{js,ts}` to every test runner. Examples
  must expose `GET / -> 200`.

New behavior needs tests that keep coverage at 100%. Run a quick end-to-end
check by adding a combo to `test/e2e/generate.e2e.js`.


## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE.md).
