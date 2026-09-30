# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Highest Level Instructions
Always present the user with a plan before performing an action.
Always ask permission to perform the action.

## Commands

```bash
npm start                # Vite dev server on http://localhost:9000 (auto-opens a browser unless CI is set)
npm run build            # production build to dist/
npm run lint             # eslint (src + test) followed by stylelint (src/**/*.css)
npm test                 # lint (via pretest), then vitest — a single run, not watch mode
npm run storybook        # Storybook dev server on port 6006
npm run build-storybook
```

Running a subset of tests (calling vitest directly also skips the `pretest` lint step):

```bash
npx vitest run test/my-app.spec.ts       # one file
npx vitest run -t "should render message" # by test name
npx vitest --watch                        # watch mode
```

The README mentions `npm run test:watch`, but that script does not exist; `vitest.config.ts` sets `watch: false`, so use `npx vitest --watch`.

## Architecture

Aurelia 2 single-page app scaffolded by `aurelia/new` (Vite + TypeScript + Vitest + Storybook). `index.html` hosts `<my-app>`, and `src/main.ts` boots Aurelia with `MyApp` as the root component. `@aurelia/router` is installed but not yet configured.

### Components are convention-based

`@aurelia/vite-plugin` pairs files by name: `foo-bar.ts` + `foo-bar.html` + `foo-bar.css` become one custom element. The exported class `FooBar` becomes the `<foo-bar>` element with no `@customElement` decorator, and the sibling HTML and CSS are wired in automatically. `src/resource.d.ts` holds the matching type declarations for `*.html` and `*.css` imports.

Consequences:

- Keep the three files side by side with identical base names; renaming one means renaming all.
- Components are not registered globally. To use one inside another's template, add `<import from="./path/to/component"></import>` at the top of that template. The same `<import>` tag pulls in third-party CSS (see `summary-item-view.html` importing the Tabler icon webfont).
- Public inputs are declared with `@bindable` from `aurelia` and bound in templates as `prop.bind="..."`.

### Layout

- `src/components/` — custom elements (ts/html/css triples)
- `src/models/` — plain data classes
- `src/stories/` — Storybook stories plus `*.mock.ts` fixture data. Stories are discovered anywhere under `src/` by the `*.stories.ts` glob, so they may also sit next to a component (as `src/my-app.stories.ts` does).
- `test/` — Vitest specs (`*.spec.ts`), kept outside `src/`

### Icons

Icons come from `@tabler/icons-webfont` and are used as `<i class="ti ti-<name>"></i>`.

### Testing

Vitest runs in jsdom and reuses `vite.config.ts` (merged in `vitest.config.ts`), so the Aurelia convention plugin applies to tests too. `test/setup.ts` installs the Aurelia `BrowserPlatform` and stops every fixture after each test. Specs render components with `createFixture(template, rootViewModel, [dependencies])` from `@aurelia/testing` and assert with the returned fixture helpers such as `assertText`.

### Storybook

Uses the `@aurelia/storybook` framework on the Vite builder. Stories either pass just `component` + `args` (args map onto the component's bindables) or supply a `render` function returning `{ template }` for custom markup. Both `vite.config.ts` and `.storybook/main.ts` exclude `@aurelia/storybook` and `@aurelia/runtime-html` from Vite's `optimizeDeps`; keep those exclusions in sync if either is changed.
