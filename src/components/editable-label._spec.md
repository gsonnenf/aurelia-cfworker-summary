Create the following component:

# Summary
An html text element that can be edited in place.

# Files
- src/components/editable-label.css
- src/components/editable-label.ts
- src/components/editable-label.html

# Specs 
- Two way databinding for the text. e.g. @bindable({ mode: BindingMode.twoWay }) value = '';
- usable as a building block for more complex components

## Edit mode
- Text rendered normal when not in edit mode
- Edits don't get added to the model until exiting edit mode.
- By default, edit mode is started by double click on the text.
- Edit mode start can be overridden by the developer and bound to a different action.
- The action to stop edit mode and apply changes is pressing enter, or change of focus.
- The action to stop edit mode and cancel is pressing escape.
- The stop edit mode actions can be overridden by the developer.
- A `contextmenu` trigger calls `preventDefault()` so the browser menu doesn't
  cover the input.
- Key triggers only fire on a focused element, so the component sets
  `tabindex="0"` on the text when one is present.

## Edit element
- The editor is a single-line `<input>` by default.
- `edit-element="textarea"` swaps it for a `<textarea>`, so the pending text
  wraps and can hold line breaks. `edit-element="input"`, or omitting the
  attribute, keeps the `<input>`.
- The text is rendered by the same element in both modes, and `value` is a
  plain string either way.
- Under `textarea` the rendered text wraps and preserves line breaks, instead
  of the single-line ellipsis used under `input`. A textarea can commit both,
  so the display has to be able to show them. A host that wants the ellipsis
  back overrides `white-space`, `overflow`, `text-overflow` and
  `overflow-wrap` on `.editable-label-text`.
- Enter cannot both insert a line break and apply the edit, so the line break
  moves to Shift+Enter under `textarea`. The exit keys themselves are the same
  for both elements:
  - Enter applies, Escape cancels.
  - `textarea` only: Shift+Enter inserts a line break instead of applying.
- `edit-exit-trigger="custom"` switches off whichever set is in effect, as it
  does for an `input`.
- `edit-blur-action` is unaffected: a focus change applies, cancels or is
  ignored in both modes, so a textarea edit can still be committed by
  clicking away.
- A textarea sizes itself to its content: it opens tall enough to show the
  whole value, and grows and shrinks as the text is typed. It has no drag
  handle, since it is never the wrong size.
- The fit is measured when the edit opens and on each keystroke. It is not
  remeasured when the editor is resized by something else, such as a
  scrollbar appearing beside it, so the height can be a line out until the
  next keystroke.

## Validation
- There should be a validator callback hook.
- By default, if validation fails it should cancel the edit.
- There should be an option to either cancel or not exit edit mode if validation fails.
- There should be a validation failed hook to run a callback.
- The validator may also replace the text, by returning
  `{ valid, text }` instead of a boolean. The replacement applies only when
  `text` is present, so `{ valid: true }` and `true` mean the same thing.
- A replacement applies on both outcomes: it is committed when the edit is
  accepted, and when the edit is rejected under
  `edit-invalid-action="edit-mode"` it seeds the still-open input as a
  suggested correction. A rejection under `cancel` discards it with the rest
  of the edit.
- `on-validation-fail` always receives the text as typed, never a
  replacement, so an error message reports what the user actually entered.


## Table of attributes and methods
| Binding | Values | Default | Purpose |
| --- | --- | --- | --- |
| `value` | string | `''` | The text. Two-way by default, so `value.bind` is enough. |
| `edit-trigger` | `<event[]>` \| `custom` | `dblclick` | Gestures that enter edit mode. Any DOM event name, optionally `:key` — e.g. `dblclick keydown:F5 keydown:Enter`. Key names are `KeyboardEvent.key` values, so they are case-sensitive. `custom` to drive it via `startEdit()`. |
| `edit-element` | `input` \| `textarea` | `input` | Which element edits the text. `textarea` accepts line breaks, and wraps both the pending text and the rendered text. |
| `edit-exit-trigger` | `default` \| `custom` | `default` | What actions exit edit mode. `default` applies on Enter and cancels on Escape; under `edit-element="textarea"` Shift+Enter inserts a line break rather than applying. `custom` switches them off for the host to handle. |
| `edit-blur-action` | `apply` \| `cancel` \| `ignore` | `apply` | What a focus change does to a pending edit. |
| `edit-invalid-action` | `cancel` \| `edit-mode` | `cancel` | What a failed validation does to a pending edit. edit-mode keeps it in edit mode. |
| `on-validation` | `(text: string) => boolean \| { valid: boolean; text?: string }` | none | Return `true`, or `{ valid: true }`, to accept the pending text. Supply `text` to replace it as well. |
| `on-validation-fail` | `(text: string) => void` | none | Called each time the validator rejects, with the text as typed rather than any replacement. |
| `editing` | boolean, readonly | `false` | `true` while the input is open. Bind it for external button state, e.g. `disabled.bind="!label.editing"`. |
| `startEdit()` / `applyEdit()` / `cancelEdit()` | methods | — | Enter and exit edit mode methods. These are used for custom triggers.|

## Example usage

### 1. Simplest case — double-click to edit

Double-click the text, type, then press Enter or click away to apply. Escape
discards the edit. Nothing reaches `title` until the edit is applied.

```html
<import from="./components/editable-label"></import>
<editable-label value.bind="title"></editable-label>
```

```ts
export class MyApp {
  title = 'Untitled';
}
```

### 2. Reject empty text

The validator runs when the edit is applied. It rejects here by returning
`false`, and the default `edit-invalid-action="cancel"` restores `'Untitled'`.

```html
<editable-label value.bind="title" on-validation.bind="notEmpty"></editable-label>
```

```ts
export class MyApp {
  title = 'Untitled';
  notEmpty = (text: string) => text.trim().length > 0;
}
```

### 3. Stay in edit mode until the text is valid

`edit-invalid-action="edit-mode"` keeps the input open so the user can correct the entry
instead of losing it, and `on-validation-fail` reports why.

```html
<editable-label
  value.bind="price"
  on-validation.bind="isPrice"
  on-validation-fail.bind="showError"
  edit-invalid-action="edit-mode">
</editable-label>
<span class="error">${error}</span>
```

```ts
export class MyApp {
  price = '9.99';
  error = '';
  isPrice = (text: string) => /^\d+(\.\d{2})?$/.test(text);
  showError = (text: string) => { this.error = `"${text}" is not a price`; };
}
```

### 4. Replace the text instead of rejecting it

The validator can return `{ valid, text }` rather than a boolean. Here an
empty entry is accepted but rewritten, so the model never holds a blank
label. `text` is only applied when present, so the non-empty branch returns
`{ valid: true }` and the text commits as typed.

```html
<editable-label value.bind="title" on-validation.bind="blankToNone"></editable-label>
```

```ts
export class MyApp {
  title = 'Untitled';
  blankToNone = (text: string) =>
    text.trim() === '' ? { valid: true, text: 'none' } : { valid: true };
}
```

Pairing a replacement with `valid: false` offers it as a correction instead of
committing it. With `edit-invalid-action="edit-mode"` the input stays open,
pre-filled with the suggestion, and the user presses Enter again to accept it:

```html
<editable-label
  value.bind="price"
  on-validation.bind="suggestPrice"
  edit-invalid-action="edit-mode">
</editable-label>
```

```ts
export class MyApp {
  price = '9.99';
  suggestPrice = (text: string) => {
    if (/^\d+\.\d{2}$/.test(text)) return { valid: true };
    // Offer a corrected form for a bare number rather than discarding it.
    return /^\d+$/.test(text) ? { valid: false, text: `${text}.00` } : { valid: false };
  };
}
```

### 5. Start edit with a keypress or right click

```html
<editable-label value.bind="title" edit-trigger="contextmenu keydown:F2"></editable-label>
```

```ts
export class MyApp {
  title = 'Untitled';
}
```

### 6. Enter edit mode, apply edit and cancel edit as external buttons

`edit-trigger="custom"` drops the built-in gesture, leaving the host in control
through `startEdit()`, `applyEdit()` and `cancelEdit()`. `view-model.ref` hands
the host a reference to each component instance, so every label needs its own
ref name. `editing` is readonly on the component, so the buttons can disable
themselves against it.

Entry and exit triggers are independent: `edit-trigger="custom"` removes only
the gesture that *starts* an edit. Enter and Escape keep working until
`edit-exit-trigger="custom"` switches them off too, so both are needed for an
edit that can only be committed or discarded through the buttons.

```html
<editable-label
  view-model.ref="firstNameLabel"
  value.bind="firstName"
  edit-trigger="custom"
  edit-exit-trigger="custom"
  edit-blur-action="ignore">
</editable-label>

<editable-label
  view-model.ref="lastNameLabel"
  value.bind="lastName"
  edit-trigger="custom"
  edit-exit-trigger="custom"
  edit-blur-action="ignore">
</editable-label>

<button click.trigger="firstNameLabel.startEdit()" disabled.bind="firstNameLabel.editing">Rename first</button>
<button click.trigger="lastNameLabel.startEdit()" disabled.bind="lastNameLabel.editing">Rename last</button>
<button click.trigger="saveAll()" disabled.bind="!editingAny">Save</button>
<button click.trigger="discardAll()" disabled.bind="!editingAny">Discard</button>
```

```ts
export class MyApp {
  firstName = 'Ada';
  lastName = 'Lovelace';
  firstNameLabel!: EditableLabel;
  lastNameLabel!: EditableLabel;

  get editingAny() { return (this.firstNameLabel?.editing ?? false) || (this.lastNameLabel?.editing ?? false); }

  saveAll = () => { this.firstNameLabel.applyEdit(); this.lastNameLabel.applyEdit(); };
  discardAll = () => { this.firstNameLabel.cancelEdit(); this.lastNameLabel.cancelEdit(); };
}
```

### 7. Exit and save edit mode using escape and enter.

By default Enter applies but Escape cancels. `edit-exit-trigger="custom"` switches
both keys off, so the host can make either one apply.

```html
<editable-label
  view-model.ref="titleLabel"
  value.bind="title"
  edit-exit-trigger="custom"
  keydown.trigger="exitKeys($event)">
</editable-label>
```

```ts
export class MyApp {
  title = 'Untitled';
  titleLabel!: EditableLabel;

  exitKeys = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      this.titleLabel.applyEdit();
    }
  };
}
```

With both keys applying, there is no keyboard way to discard an edit — pair it
with `edit-blur-action="apply"` (the default) so every exit route commits.

### 8. Edit a long value in a textarea

`edit-element="textarea"` suits text that runs past one line. The editor wraps
instead of scrolling sideways, and Enter applies the edit as it does for an
input. Shift+Enter inserts a line break, and clicking away still applies under
the default `edit-blur-action`.

The editor opens fitted to the text, so a long value needs no scrolling or
resizing to read, and it refits on every keystroke.

```html
<editable-label value.bind="summary" edit-element="textarea"></editable-label>
```

```ts
export class MyApp {
  summary = 'A summary long enough to wrap onto several lines when edited.';
}
```

The rendered text wraps too, so a long value reads the same whether or not
the editor is open. No host CSS is needed for that.

Because Enter inserts a line break, `value` can come back with `\n` in it. A
host that needs a single line should reject or rewrite it in the validator
rather than relying on the editor to prevent it:

```html
<editable-label
  value.bind="summary"
  edit-element="textarea"
  on-validation.bind="oneLine">
</editable-label>
```

```ts
export class MyApp {
  summary = 'A summary.';
  oneLine = (text: string) => ({ valid: true, text: text.replace(/\s*\n+\s*/g, ' ') });
}
```
