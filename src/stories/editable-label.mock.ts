import type { EditableLabel } from '../components/editable-label';

/**
 * Story args for `<editable-label>`, one export per example in
 * `editable-label._spec.md` (and in `my-app.ts`, the manual test bench).
 *
 * The Storybook renderer assigns these onto an anonymous host view model, so
 * each object *is* the template's binding context. Callbacks are therefore
 * declared as regular functions, not arrows, so `this` is that host and a
 * handler can write state the template displays.
 */

/** Example 1 and the smoke test: nothing but text. */
export interface EditableLabelTextArgs {
  value: string;
}

/** Smoke test: two-way binding, direct and through a nested object. */
export interface EditableLabelSmokeArgs {
  myText: string;
  myContainer: { myText: string };
}

export const EditableLabelSmokeMock: EditableLabelSmokeArgs = {
  myText: 'This is my text.',
  myContainer: { myText: 'This is my container text.' },
};

/** Example 1: the default — double-click to edit. */
export const EditableLabelBasicMock: EditableLabelTextArgs = {
  value: 'Untitled',
};

/** Example 2: a validator that rejects empty text, cancelling the edit. */
export interface EditableLabelRequiredArgs {
  value: string;
  notEmpty: (text: string) => boolean;
}

export const EditableLabelRequiredMock: EditableLabelRequiredArgs = {
  value: 'Untitled',
  notEmpty: (text: string): boolean => text.trim().length > 0,
};

/** Example 3: invalid text holds the input open and reports why. */
export interface EditableLabelPriceArgs {
  value: string;
  priceError: string;
  isPrice: (text: string) => boolean;
  showPriceError: (text: string) => void;
}

export const EditableLabelPriceMock: EditableLabelPriceArgs = {
  value: '9.99',
  priceError: '',
  isPrice: (text: string): boolean => /^\d+(\.\d{2})?$/.test(text),
  // Regular function: `this` is the host, so the template's `${priceError}` updates.
  showPriceError: function (this: EditableLabelPriceArgs, text: string): void {
    this.priceError = `"${text}" is not a price`;
  },
};

/** Example 4: the validator rewrites the text instead of rejecting it. */
export interface EditableLabelCoerceArgs {
  value: string;
  blankToNone: (text: string) => { valid: boolean; text?: string };
}

export const EditableLabelCoerceMock: EditableLabelCoerceArgs = {
  value: 'Untitled',
  // `text` is only applied when present, so the non-empty branch commits as typed.
  blankToNone: (text: string) => (text.trim() === '' ? { valid: true, text: 'none' } : { valid: true }),
};

/** Example 4b: a rejection that offers a correction instead of discarding. */
export interface EditableLabelSuggestArgs {
  value: string;
  suggestPrice: (text: string) => { valid: boolean; text?: string };
}

export const EditableLabelSuggestMock: EditableLabelSuggestArgs = {
  value: '9.99',
  suggestPrice: (text: string) => {
    if (/^\d+\.\d{2}$/.test(text)) return { valid: true };
    // Offer a corrected form for a bare number rather than discarding it.
    return /^\d+$/.test(text) ? { valid: false, text: `${text}.00` } : { valid: false };
  },
};

/** Example 5: a right-click or F2 starts the edit instead of a double-click. */
export const EditableLabelTriggerMock: EditableLabelTextArgs = {
  value: 'Right-click me, or focus me and press F2',
};

/** Example 6: external buttons drive edit mode through the component's methods. */
export interface EditableLabelButtonsArgs {
  firstName: string;
  lastName: string;
  /** Assigned by `view-model.ref` in the template. */
  firstNameLabel?: EditableLabel;
  lastNameLabel?: EditableLabel;
  saveAll: () => void;
  discardAll: () => void;
}

export const EditableLabelButtonsMock: EditableLabelButtonsArgs = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  saveAll: function (this: EditableLabelButtonsArgs): void {
    this.firstNameLabel?.applyEdit();
    this.lastNameLabel?.applyEdit();
  },
  discardAll: function (this: EditableLabelButtonsArgs): void {
    this.firstNameLabel?.cancelEdit();
    this.lastNameLabel?.cancelEdit();
  },
};

/** Example 7: the host decides the exit keys; here both Enter and Escape apply. */
export interface EditableLabelCustomExitArgs {
  value: string;
  customExitLabel?: EditableLabel;
  exitKeys: (event: KeyboardEvent) => void;
}

export const EditableLabelCustomExitMock: EditableLabelCustomExitArgs = {
  value: 'Enter and Escape both save',
  exitKeys: function (this: EditableLabelCustomExitArgs, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Escape') {
      this.customExitLabel?.applyEdit();
    }
  },
};

/** Example 8: a textarea editor for text long enough to wrap. */
export const EditableLabelTextareaMock: EditableLabelTextArgs = {
  value: 'A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited. A summary long enough to wrap onto several lines when edited.   '
    + 'Press Enter to apply, Shift+Enter for a line break, Escape to discard.',
};

/** Example 8b: a validator that folds any line breaks back into one line. */
export interface EditableLabelOneLineArgs {
  value: string;
  oneLine: (text: string) => { valid: boolean; text?: string };
}

export const EditableLabelOneLineMock: EditableLabelOneLineArgs = {
  value: 'Line breaks typed here are folded back into a single line.',
  oneLine: (text: string) => ({ valid: true, text: text.replace(/\s*\n+\s*/g, ' ') }),
};


  // Dev hook: exposes mocks on the Storybook top frame as `Mock`, so the model
// can be inspected from the console without switching to the preview iframe.
const Mock: Record<string, unknown> = ((window.top ?? window) as unknown as
  { Mock?: Record<string, unknown> }).Mock ??= {};
Mock.EditableLabelSmokeMock = EditableLabelSmokeMock;
Mock.EditableLabelBasicMock = EditableLabelBasicMock;
Mock.EditableLabelRequiredMock = EditableLabelRequiredMock;
Mock.EditableLabelPriceMock = EditableLabelPriceMock;
Mock.EditableLabelCoerceMock = EditableLabelCoerceMock;
Mock.EditableLabelSuggestMock = EditableLabelSuggestMock;
Mock.EditableLabelTriggerMock = EditableLabelTriggerMock;
Mock.EditableLabelButtonsMock = EditableLabelButtonsMock;
Mock.EditableLabelCustomExitMock = EditableLabelCustomExitMock;
Mock.EditableLabelTextareaMock = EditableLabelTextareaMock;
Mock.EditableLabelOneLineMock = EditableLabelOneLineMock;
