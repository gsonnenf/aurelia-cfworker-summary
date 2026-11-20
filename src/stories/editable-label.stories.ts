import type { Meta, StoryObj } from '@aurelia/storybook';
import { EditableLabel } from '../components/editable-label';
import {
  EditableLabelBasicMock,
  EditableLabelButtonsMock,
  EditableLabelCoerceMock,
  EditableLabelCustomExitMock,
  EditableLabelOneLineMock,
  EditableLabelPriceMock,
  EditableLabelRequiredMock,
  EditableLabelSmokeMock,
  EditableLabelSuggestMock,
  EditableLabelTextareaMock,
  EditableLabelTriggerMock,
} from './editable-label.mock';

const meta: Meta<EditableLabel> = {
  title: 'Components/EditableLabel',
  component: EditableLabel,
};

export default meta;

type Story = StoryObj<EditableLabel>;

/**
 * Smoke test: two-way binding, direct and through a nested object, to confirm
 * the edit reaches the model and not just the view.
 */
export const SmokeTest: Story = {
  render: () => ({
    template: `
      <p><editable-label value.bind="myText"></editable-label></p>
      <p><editable-label value.bind="myContainer.myText"></editable-label></p>
      <p>Model values: <strong>\${myText}</strong> / <strong>\${myContainer.myText}</strong></p>
    `,
  }),
  args: EditableLabelSmokeMock,
};

/**
 * Example 1: the default. Double-click, type, then Enter or click away to
 * apply; Escape discards. Only the component's own bindables are bound, so
 * this story lets the renderer generate the template from `args`.
 */
export const DoubleClickToEdit: Story = {
  args: EditableLabelBasicMock,
};

/**
 * Example 2: the validator runs when the edit is applied. Returning false
 * here, with the default `edit-invalid-action="cancel"`, restores the
 * previous text.
 */
export const RejectEmptyText: Story = {
  render: () => ({
    template: `
      <p><editable-label value.bind="value" on-validation.bind="notEmpty"></editable-label></p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelRequiredMock,
};

/**
 * Example 3: `edit-invalid-action="edit-mode"` holds the input open so a bad
 * entry can be corrected instead of lost, and `on-validation-fail` reports why.
 */
export const StayInEditModeUntilValid: Story = {
  render: () => ({
    template: `
      <p>
        <editable-label
          value.bind="value"
          on-validation.bind="isPrice"
          on-validation-fail.bind="showPriceError"
          edit-invalid-action="edit-mode">
        </editable-label>
      </p>
      <p class="error">\${priceError}</p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelPriceMock,
};

/**
 * Example 4: the validator returns `{ valid, text }` rather than a boolean, so
 * it can replace the text instead of rejecting it. A replacement applies only
 * when `text` is present, so the non-empty branch returns `{ valid: true }`
 * and commits as typed. Clear the text and apply to see `none` reach the model.
 */
export const ReplaceTextOnValidation: Story = {
  render: () => ({
    template: `
      <p><editable-label value.bind="value" on-validation.bind="blankToNone"></editable-label></p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelCoerceMock,
};

/**
 * Example 4b: pairing a replacement with `valid: false` offers it as a
 * correction instead of committing it. Under `edit-invalid-action="edit-mode"`
 * the input stays open pre-filled with the suggestion, so typing a bare `10`
 * comes back as `10.00` for a second Enter to accept.
 */
export const SuggestACorrection: Story = {
  render: () => ({
    template: `
      <p>
        <editable-label
          value.bind="value"
          on-validation.bind="suggestPrice"
          edit-invalid-action="edit-mode">
        </editable-label>
      </p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelSuggestMock,
};

/**
 * Example 5: any DOM event name works, optionally suffixed with `:key`. Key
 * names are `KeyboardEvent.key` values, so they are case-sensitive. The
 * component adds `tabindex="0"` itself, since key events only fire on a
 * focused element, and calls `preventDefault()` on `contextmenu` so the
 * browser menu does not cover the input.
 */
export const RightClickOrF2ToEdit: Story = {
  render: () => ({
    template: `
      <p>
        <editable-label
          value.bind="value"
          edit-trigger="contextmenu keydown:F2">
        </editable-label>
      </p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelTriggerMock,
};

/**
 * Example 6: `edit-trigger="custom"` drops the built-in gesture, leaving the
 * buttons in control through `startEdit()`, `applyEdit()` and `cancelEdit()`.
 * `view-model.ref` hands over a reference to each instance, so every label
 * needs its own ref name, and `edit-blur-action="ignore"` keeps a pending edit
 * alive while focus moves to a button.
 *
 * Entry and exit triggers are independent, so `edit-exit-trigger="custom"` is
 * needed as well: without it Enter and Escape would still commit or discard an
 * edit without the Save and Discard buttons being involved.
 */
export const ExternalButtons: Story = {
  render: () => ({
    template: `
      <p>
        First name:
        <editable-label
          view-model.ref="firstNameLabel"
          value.bind="firstName"
          edit-trigger="custom"
          edit-exit-trigger="custom"
          edit-blur-action="ignore">
        </editable-label>
      </p>
      <p>
        Last name:
        <editable-label
          view-model.ref="lastNameLabel"
          value.bind="lastName"
          edit-trigger="custom"
          edit-exit-trigger="custom"
          edit-blur-action="ignore">
        </editable-label>
      </p>
      <p>
        <button click.trigger="firstNameLabel.startEdit()" disabled.bind="firstNameLabel.editing">Rename first</button>
        <button click.trigger="lastNameLabel.startEdit()" disabled.bind="lastNameLabel.editing">Rename last</button>
        <button click.trigger="saveAll()" disabled.bind="!firstNameLabel.editing && !lastNameLabel.editing">Save</button>
        <button click.trigger="discardAll()" disabled.bind="!firstNameLabel.editing && !lastNameLabel.editing">Discard</button>
      </p>
      <p>Model values: <strong>\${firstName} \${lastName}</strong></p>
    `,
  }),
  args: EditableLabelButtonsMock,
};

/**
 * Example 7: by default Enter applies and Escape cancels.
 * `edit-exit-trigger="custom"` switches both keys off so the host can decide;
 * here both apply. With no keyboard route left for discarding, it is paired
 * with the default `edit-blur-action="apply"` so every exit route commits.
 */
export const CustomExitKeys: Story = {
  render: () => ({
    template: `
      <p>
        <editable-label
          view-model.ref="customExitLabel"
          value.bind="value"
          edit-exit-trigger="custom"
          keydown.trigger="exitKeys($event)">
        </editable-label>
      </p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelCustomExitMock,
};

/**
 * Example 8: `edit-element="textarea"` swaps the single-line input for a
 * wrapping editor. Enter applies the edit just as it does for an input, and
 * Shift+Enter inserts a line break; Escape still cancels, and clicking away
 * still applies under the default `edit-blur-action`.
 *
 * The flag only changes the editor, so the rendered text keeps the
 * component's single-line ellipsis until the host overrides it.
 */
export const TextareaEditor: Story = {
  render: () => ({
    template: `
      <p style="white-space: normal">
        <editable-label value.bind="value" edit-element="textarea"></editable-label>
      </p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelTextareaMock,
};

/**
 * Example 8b: a textarea lets `value` come back with `\n` in it. A host that
 * needs one line folds the breaks away in the validator rather than relying
 * on the editor to prevent them.
 */
export const TextareaFoldedToOneLine: Story = {
  render: () => ({
    template: `
      <p style="white-space: normal">
        <editable-label
          value.bind="value"
          edit-element="textarea"
          on-validation.bind="oneLine">
        </editable-label>
      </p>
      <p>Model value: <strong>\${value}</strong></p>
    `,
  }),
  args: EditableLabelOneLineMock,
};
