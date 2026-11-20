# Aurelia Headless UI — implementation notes

Carry-forward notes for adopting `@aurelia-ui-toolkits/headless` as the control
library for modal forms, and eventually for toasts, alerts and tables.

Steps 1–3 are done. The library is installed, registered, and proven to mount
and bind. The rest of this file is still the plan.

## Why this library

Evaluated against SweetAlert2 (current), Adobe Spectrum Web Components, Web
Awesome (Shoelace's successor), `@aurelia-mdc-web`, and hand-rolled native
`<dialog>`.

It won on inventory rather than on being Aurelia-native:

- Form controls: `ui-input` (text **and** textarea via a `textarea` property),
  `ui-switch`, `ui-radio-group`/`ui-radio`, `ui-checkbox`, `ui-select`,
  `ui-combobox`, `ui-datepicker`, `ui-slider`, `ui-segmented-control`, plus
  input masking.
- Forms and validation already present: `ui-form`, `ui-validation-container`,
  `ui-validation-result-presenter`, a `validate` attribute, and an
  `IValidatedElement` interface (`addError`/`removeError`/`valid`).
- An `AlertService` covering `alert`, `confirm`, `prompt`, `error`,
  `criticalError`, `showModal`, `open`, and `usingProgress` with `busy$`.
- A toast service (`UiToastService` + `UiToastRegion`).

So the config-driven form generator that was being designed by hand largely
exists already, and the same library serves the dynamic data-editing side of
the app where two-way binding *is* wanted.

Rejected alternatives, briefly:

- **Shoelace** — end of life; last release March 2025.
- **Web Awesome** — alive and good, but freemium, and a whole design system to
  override.
- **Spectrum Web Components** — Apache-2.0 and stable at 1.x, but a strongly
  Adobe look, and its typography depends on Adobe Clean, which is not licensed
  for non-Adobe products.
- **`@aurelia-mdc-web`** — Aurelia 2 support only under the `au2` dist-tag, and
  it wraps Google's Material Components Web, which is itself in maintenance.

## Facts worth not re-deriving

- Packages: `@aurelia-ui-toolkits/headless` and
  `@aurelia-ui-toolkits/headless-tailwind`, both **MIT**, both `1.3.11` as of
  2026-10-14. First release was May 2026, so this is early-adopter territory:
  one maintainer (MaximBalaganskiy, also of `aurelia-mdc-web`), 7 stars.
- Peer dependencies: `aurelia >=2.0.0-rc.2` and `@aurelia/dialog >=2.0.0-rc.2`.
  Both match the versions this app already pins. `@aurelia/dialog` is **not
  optional** — it is a hard peer, so it gets installed even before any dialog
  is used.
- Transitive dependencies it brings: `date-fns`, `inputmask`, `tslib`.
- **Its manifest is incomplete.** The shipped code imports `rxjs` (for
  `AlertService`'s `busy$`) and `@aurelia/validation-html`, and declares
  neither as a dependency or a peer. Both must be installed by hand or Vite
  fails to resolve them. Pin `rxjs` to **7.x**: the imports are deep private
  paths (`rxjs/internal/Subject`, `.../operators/scan`) that 8.x no longer
  exposes. `@aurelia/validation-html` and `@aurelia/validation` go at
  `2.0.0-rc.2`, matching the pinned `aurelia`.
- Repo default branch is `master`, not `main`.

## Steps

Each item is its own prompt. Do not batch.

1. ~~`npm install @aurelia-ui-toolkits/headless @aurelia/dialog`~~ **done**,
   plus the undeclared dependencies above. Still **not** `headless-tailwind`;
   see Styling below.
2. ~~Register the plugin~~ **done**, in *two* places — see below.
3. ~~One story to confirm the components mount and bind~~ **done**:
   `src/stories/DynamicTestAh.stories.ts` composes a `ui-segmented-control`
   into an `<au-compose>` on a button press. Mounting and two-way binding both
   survive dynamic composition.
4. Add per-component CSS only as a component proves unusable without it.
   `ui-segmented-control` is done (`ui-segmented-control.css`), and the tokens
   it needed are in `headless-tokens.css`, which covers most of what the next
   component will want. That control defines no `--ui-segment-*` properties of
   its own — it is styled entirely from the shared tokens.
5. Decide whether `AlertService` replaces `DisplayMessageSw`, or sits beside it.
6. Build the form generator over `ui-form` + the `validate` attribute.
7. Wire the result to the `detail-controls` add button in
   `summary-list-view.html`, which is still unwired.

### Registration gotcha

The README says:

```ts
import { AureliaHeadless } from '@aurelia-ui-toolkits/headless';
Aurelia.register(AureliaHeadless)
```

**`AureliaHeadless` does not exist in the shipped package.** The actual export
is `AureliaHeadlessConfiguration`, with `register(container)` and
`customize(optionsProvider)`:

```ts
import { AureliaHeadlessConfiguration } from '@aurelia-ui-toolkits/headless';
Aurelia.register(AureliaHeadlessConfiguration)
```

`customize()` reaches a `HeadlessConfiguration` aggregating per-component
config: `field`, `table`, `datepicker`.

It has to be registered **twice**, because Storybook never loads `src/main.ts`:

- `src/main.ts` — `.register(AureliaHeadlessConfiguration)` for the app.
- `.storybook/preview.ts` — a `Preview` default export carrying
  `parameters.aurelia.register: [AureliaHeadlessConfiguration]`, which the
  plugin documents as the place for global Aurelia resources. Registering per
  story with `items` also works but does not scale.

This is not duplication to clean up later. Each environment bootstraps its own
Aurelia instance.

## Styling

**Start with no styling at all.** The components ship no CSS of their own and
depend on no theme, so they mount and function unstyled. Fix appearance only
where a component is actually unusable. The app's visual direction is still
undecided and may change drastically, so no effort goes into a theme that is
likely to be thrown away.

Tailwind is deliberately **not** being adopted. `headless-tailwind` is the
ready-made theme and would require `tailwindcss >=4.0.0` as a build dependency.
That is a real option later — it needs only `tailwindcss` + `@tailwindcss/vite`
in `vite.config.ts`, and the plugin would also have to be added to
`.storybook/main.ts`'s `viteFinal`, since the Storybook Vite builder does not
inherit root plugins. If adopted, omit Preflight (Tailwind's global reset,
which strips margins, padding, heading styles and list markers) by importing
the pieces individually rather than `@import "tailwindcss"`:

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

### Read headless-tailwind as the DOM contract

Do not reverse-engineer the components' markup. The `headless-tailwind`
package is, in effect, the missing documentation: one `*-theme.css` file per
component, naming every class, every `data-*` state hook, and every custom
property the markup expects. Read it as a spec and hand-write plain CSS against
the same selectors, translating its `@apply` lines into ordinary declarations.

```
npm pack @aurelia-ui-toolkits/headless-tailwind
```

Keeping the same class names means adopting the real theme later is a swap, not
a rewrite.

Example — the switch's entire contract:

```
.ui-switch, .ui-switch__thumb
[data-checked] [data-active] [data-changing] [data-disabled] :focus-visible
--ui-switch-width --ui-switch-height --ui-switch-thumb-size
--ui-switch-thumb-offset --ui-switch-active-offset
```

Reference theme sizes, as a rough guide to how much CSS each component needs:

| Component                 | Lines | Classes |
| ------------------------- | ----- | ------- |
| `ui-toast`                | 19    | 3       |
| `ui-validation-container` | 20    | 3       |
| `ui-dialog`               | 32    | 0       |
| `ui-switch`               | 47    | 2       |
| `ui-radio` (incl. group)  | 71    | 8       |
| `ui-checkbox`             | 132   | 9       |
| `ui-button`               | 157   | 2       |
| `ui-input`                | 177   | 10      |

`ui-input` is the largest because it carries label, inset/floating label,
leading and trailing slots, helper text, errors and subscript.

### Token conventions, if a theme is ever written

Per the library README:

- Its tokens live in Tailwind's `theme` cascade layer, so **a plain unlayered
  `:root` rule always wins** — no specificity fight, same reasoning as the
  existing `--swal2-*` overrides in `DisplayMessageSw.css`.
- Dark mode has its own selector: override `:root[data-theme="dark"]`.
- `--color-accent` and `--color-accent-raised` are brand *foreground* tokens,
  kept apart from the primary ramp. Both default to the ramp; set them
  separately when overriding per subtree, and for dark mode.

## AlertService vs the existing IUiMessageDisplay

`AlertService` overlaps `DisplayMessageSw` almost exactly, including the
`critical` case, but **its tone model is narrower**: four tones against the
seven in `DisplayType`.

```ts
tone?: 'info' | 'success' | 'warning' | 'danger'
```

| `DisplayType` | Headless equivalent                                  |
| ------------- | ---------------------------------------------------- |
| `info`        | `tone: 'info'`                                       |
| `success`     | `tone: 'success'`                                     |
| `warning`     | `tone: 'warning'`                                     |
| `error`       | `tone: 'danger'`                                      |
| `fail`        | no equivalent — collapses into `danger`               |
| `pending`     | not a toast; `usingProgress()` / `busy$` instead      |
| `critical`    | not a toast; `criticalError(message, error)` dialog   |

Two of those are arguably improvements: `critical` as a dialog rather than a
toast, and `pending` as a busy state rather than a timer-less toast.

Also absent: the per-caller override registry
(`registerCallerDisplayMessage`) and the `callerIdentifier` argument. Nothing
in the library corresponds to it.

So migrating means **keeping `IUiMessageDisplay` as the contract** and writing
a second implementation over `UiToastService`/`AlertService` — which is what
the DI token was for. It is not a drop-in swap, and the display taxonomy has
to be re-settled first.

## Dead code to remove once committed to this direction

- `src/contracts/ui/IDisplayForm.ts`
- `src/services/ui/DisplayFormSw.ts`
- `src/services/ui/DisplayFormSw.css`
- `src/stories/DisplayFormSw.stories.ts`

These implement a two-textarea SweetAlert2 form that this library supersedes.
`IPromptDialogData` (`{title, label, text, required, textarea, okText,
cancelText}`) is the library's single-field equivalent.

Keep `DisplayMessageSw` until step 5 is decided — toasts and confirmations
still run through it.

## Known traps

- The `@aurelia/storybook` renderer ignores a story's view model when the story
  returns both `template` and `Component`; the root binding context becomes an
  anonymous class and click handlers silently do nothing. Return `Component`
  alone and give the class its own template via `CustomElement.define`. Already
  hit once, in `DisplayFormSw.stories.ts`.
- `<import from="...">` is **inert in an inline template string**. The Vite
  plugin rewrites those tags into dependencies only inside `.html` files, and
  a template defined with `CustomElement.define` never passes through it. The
  tag fails silently — no error, no styles. Use an ordinary module import for
  global CSS, or `*.css?inline` plus `dependencies` for scoped styles
  (`src/resource.d.ts` already declares the `?inline` type).
- SweetAlert2 keeps a hidden `.swal2-textarea` inside every popup, so a bare
  `textarea` selector finds more elements than the markup declares. Relevant
  only while `DisplayMessageSw` survives.
- `src/my-app.ts` has an unused `EditableLabel` import that fails `npm run
  lint`, and therefore `npm test` via `pretest`. Pre-existing, unrelated.

## References

- Demo and docs: https://aurelia-ui-toolkits.github.io/aurelia-headless/#/
  Good documentation, and the best starting point when reading in a browser.
  It is a hash-routed, client-rendered SPA, so fetching the URL returns an
  empty shell — no use to a tool that cannot run JavaScript. The pages are
  generated from `packages/app/src/views/<component>/` in the repo (31 of
  them, one per site page, plus `get-started` and `theme-builder`), and those
  files fetch fine from `raw.githubusercontent.com`. Read the source when the
  rendered page is unreachable.
- Repo (branch `master`): https://github.com/aurelia-ui-toolkits/aurelia-headless
- Announcement thread, with the maintainer answering questions:
  https://discourse.aurelia.io/t/aurelia-headless-ui-composable-headless-components-for-aurelia-2/6698
- Theme sources in-repo: `packages/tailwind/src/` — `theme.css`, `index.css`,
  `a11y.css`, and one `ui-*-theme.css` per component.
- Per-component demo views in-repo: `packages/app/src/views/<component>/`.
  These are the closest thing to usage examples, and they are what the docs
  site renders.

Three sources, with different strengths — reading all three before using a new
component is quicker than guessing from any one:

| Source | Gives |
| ------ | ----- |
| `node_modules/@aurelia-ui-toolkits/headless/dist/types/<component>/` | the exhaustive API: every bindable and method |
| `packages/app/src/views/<component>/` in the repo | idiomatic usage; which bindables are used together |
| `headless-tailwind`'s `ui-<component>-theme.css` | the DOM contract: classes, `data-*` states, custom properties |
- Interactive theme builder in-repo: `packages/app/src/views/theme-builder/`.
- Tailwind, if ever adopted: https://tailwindcss.com/docs/installation/using-vite
  and https://tailwindcss.com/docs/preflight
