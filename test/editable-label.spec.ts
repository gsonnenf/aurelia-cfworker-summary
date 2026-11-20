import { createFixture } from '@aurelia/testing';
import { assert, describe, it } from 'vitest';
import { EditableLabel } from '../src/components/editable-label';

/**
 * Black-box tests: every interaction goes through real DOM events and every
 * assertion lands on the bound model or the rendered DOM, never on the
 * component's internals. That is what let the previous suite survive a full
 * reimplementation of the component.
 */

interface LabelledItem {
  label: string;
}

interface Host {
  item: LabelledItem;
  /** Filled by `component.ref`, so tests can reach the imperative API. */
  el: EditableLabel;
  [key: string]: unknown;
}

/**
 * Aurelia's `if.bind` swaps the span and the input on a render tick, and
 * `startEdit()` moves focus across a microtask, so every interaction needs a
 * flush before the DOM is asserted on.
 */
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 10));

async function mount(attrs = '', extra: Record<string, unknown> = {}) {
  // Bind through a property path on a nested object, the way a real consumer
  // does, so a commit has to travel back out to the model to pass.
  const template = `<editable-label component.ref="el" value.bind="item.label" ${attrs}></editable-label>`;
  const host = { item: { label: 'original' }, ...extra } as Host;
  const { appHost } = await createFixture(template, host, [EditableLabel]).started;

  const text = () => appHost.querySelector('.editable-label-text');
  // Either editor: `edit-element` decides which one `if.bind` renders, and
  // every helper below works the same against both.
  const input = () => appHost.querySelector('input, textarea') as
    HTMLInputElement | HTMLTextAreaElement | null;

  return {
    host,
    get model() { return host.item; },
    get component() { return host.el; },
    text,
    input,
    /** The open input, failing loudly rather than returning null. */
    openInput: () => {
      const el = input();
      assert.isNotNull(el, 'expected the input to be open');
      return el as HTMLInputElement | HTMLTextAreaElement;
    },
    dispatch: (event: Event) => {
      (text() ?? appHost.firstElementChild!).dispatchEvent(event);
      return event;
    },
    dblclick: () => appHost
      .querySelector('.editable-label-text')!
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true })),
    /** A draft only reaches the view model through a `change` event; setting
     *  `input.value` alone never updates the binding. */
    type: (value: string) => {
      const el = input()!;
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    /** `modifiers` carries the Ctrl/Cmd that applies a textarea edit. */
    press: (key: string, modifiers: KeyboardEventInit = {}) => input()!
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers })),
    blur: () => input()!.dispatchEvent(new Event('blur', { bubbles: false })),
  };
}

describe('editable-label', () => {

  describe('default gestures', () => {
    it('renders the bound value as text', async () => {
      const f = await mount();

      assert.strictEqual(f.text()!.textContent, 'original');
      assert.isNull(f.input());
    });

    it('opens an input seeded with the model value on double-click', async () => {
      const f = await mount();

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().value, 'original');
      assert.isNull(f.text());
    });

    it('commits on Enter', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('renamed');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'renamed');
      assert.strictEqual(f.text()!.textContent, 'renamed');
    });

    it('restores the previous value on Escape', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('typed over');
      f.press('Escape');
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.strictEqual(f.text()!.textContent, 'original');
    });
  });

  describe('draft isolation', () => {
    it('leaves the model untouched while the edit is pending', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('not yet applied');
      await flush();

      assert.strictEqual(f.model.label, 'original');
    });

    it('starts the next edit from the model after a cancel', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('abandoned');
      f.press('Escape');
      await flush();

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().value, 'original');
    });

    it('starts the next edit from the model after a commit', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('first');
      f.press('Enter');
      await flush();

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().value, 'first');
    });
  });

  describe('edit triggers', () => {
    it('ignores double-click when the trigger is custom', async () => {
      const f = await mount('edit-trigger="custom"');

      f.dblclick();
      await flush();

      assert.isNull(f.input());
    });

    it('opens on a configured key', async () => {
      const f = await mount('edit-trigger="keydown:F2"');

      f.dispatch(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
      await flush();

      assert.strictEqual(f.openInput().value, 'original');
    });

    it('matches key names case-sensitively', async () => {
      const f = await mount('edit-trigger="keydown:f2"');

      f.dispatch(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
      await flush();

      assert.isNull(f.input());
    });

    it('opens on contextmenu and suppresses the browser menu', async () => {
      const f = await mount('edit-trigger="contextmenu"');

      const event = f.dispatch(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      await flush();

      assert.isNotNull(f.input());
      assert.isTrue(event.defaultPrevented, 'contextmenu should be prevented');
    });

    // One fixture per test: two `mount()` calls in a single test share a host
    // and the second one's queries can land on the first one's DOM.
    it('honours the key gesture in a multi-gesture trigger', async () => {
      const f = await mount('edit-trigger="dblclick keydown:F2"');

      f.dispatch(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
      await flush();

      assert.isNotNull(f.input());
    });

    it('honours the click gesture in a multi-gesture trigger', async () => {
      const f = await mount('edit-trigger="dblclick keydown:F2"');

      f.dblclick();
      await flush();

      assert.isNotNull(f.input());
    });

    it('makes the text focusable when a key gesture is configured', async () => {
      const f = await mount('edit-trigger="keydown:F2"');

      assert.strictEqual(f.text()!.getAttribute('tabindex'), '0');
    });

    it('leaves the text unfocusable when no key gesture is configured', async () => {
      const f = await mount();

      assert.isNull(f.text()!.getAttribute('tabindex'));
    });
  });

  describe('edit element', () => {
    it('edits in an input by default', async () => {
      const f = await mount();

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().tagName, 'INPUT');
    });

    it('edits in an input when the element is input', async () => {
      const f = await mount('edit-element="input"');

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().tagName, 'INPUT');
    });

    it('edits in a textarea when the element is textarea', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().tagName, 'TEXTAREA');
    });

    it('seeds the textarea with the model value', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();

      assert.strictEqual(f.openInput().value, 'original');
    });

    it('renders the value as text when not editing a textarea', async () => {
      const f = await mount('edit-element="textarea"');

      assert.strictEqual(f.text()!.textContent, 'original');
      assert.isNull(f.input());
    });

    it('marks the rendered text as wrapping under textarea', async () => {
      const f = await mount('edit-element="textarea"');

      assert.isTrue(f.text()!.classList.contains('editable-label-text-wrap'));
    });

    it('leaves the rendered text unwrapped under input', async () => {
      const f = await mount();

      assert.isFalse(f.text()!.classList.contains('editable-label-text-wrap'));
    });

    it('keeps the wrap class after a textarea edit is committed', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.type('first\nsecond');
      f.press('Enter');
      await flush();

      assert.isTrue(f.text()!.classList.contains('editable-label-text-wrap'));
    });

    it('commits a textarea edit on Enter', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.type('renamed');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'renamed');
      assert.strictEqual(f.text()!.textContent, 'renamed');
    });

    it('leaves Shift+Enter to the textarea instead of committing', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.type('still editing');
      f.press('Enter', { shiftKey: true });
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.strictEqual(f.openInput().tagName, 'TEXTAREA');
    });

    it('lets the browser insert the Shift+Enter line break', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      const prevented = f.press('Enter', { shiftKey: true });

      // `press` returns false when a handler called preventDefault, which
      // would stop the textarea inserting the break itself.
      assert.isTrue(prevented, 'expected Shift+Enter to go unhandled');
    });

    it('commits on Shift+Enter in an input, which has no line break to insert', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('renamed');
      f.press('Enter', { shiftKey: true });
      await flush();

      assert.strictEqual(f.model.label, 'renamed');
    });

    it('discards a textarea edit on Escape', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.type('typed over');
      f.press('Escape');
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.strictEqual(f.text()!.textContent, 'original');
    });

    it('commits a textarea edit on blur', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.type('renamed');
      f.blur();
      await flush();

      assert.strictEqual(f.model.label, 'renamed');
    });

    it('commits line breaks typed into a textarea', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.type('first\nsecond');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'first\nsecond');
    });

    /**
     * jsdom does no layout, so `scrollHeight` is always 0. Stubbing it is the
     * only way to tell "fitted the box to the content" apart from "wrote 0px
     * because there is no layout engine". These tests prove the sizing runs
     * and uses the content height; whether the result *looks* right needs a
     * real browser.
     */
    const stubScrollHeight = (el: HTMLElement, value: number) =>
      Object.defineProperty(el, 'scrollHeight', { value, configurable: true });

    it('fits the textarea to its content when the edit opens', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      const el = f.openInput();
      stubScrollHeight(el, 120);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();

      assert.strictEqual(el.style.height, '120px');
    });

    it('refits the textarea as the text grows', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      const el = f.openInput();

      stubScrollHeight(el, 60);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      assert.strictEqual(el.style.height, '60px');

      stubScrollHeight(el, 180);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      assert.strictEqual(el.style.height, '180px');
    });

    it('shrinks the textarea when text is removed', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      const el = f.openInput();

      stubScrollHeight(el, 180);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      stubScrollHeight(el, 40);
      el.dispatchEvent(new Event('input', { bubbles: true }));

      assert.strictEqual(el.style.height, '40px');
    });

    it('does not size an input editor', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      const el = f.openInput();
      stubScrollHeight(el, 120);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();

      assert.strictEqual(el.style.height, '');
    });

    it('focuses the editor on a second edit', async () => {
      const f = await mount('edit-element="textarea"');

      f.dblclick();
      await flush();
      f.press('Escape');
      await flush();

      f.dblclick();
      await flush();

      assert.strictEqual(document.activeElement, f.openInput());
    });

    it('makes Enter inert in a textarea when the exit trigger is custom', async () => {
      const f = await mount('edit-element="textarea" edit-exit-trigger="custom" edit-blur-action="ignore"');

      f.dblclick();
      await flush();
      f.type('not committed');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.strictEqual(f.openInput().tagName, 'TEXTAREA');
    });
  });

  describe('validation', () => {
    const notEmpty = (text: string) => text.trim().length > 0;

    it('commits when the validator accepts', async () => {
      const f = await mount('on-validation.bind="validate"', { validate: notEmpty });

      f.dblclick();
      await flush();
      f.type('valid');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'valid');
    });

    it('cancels the edit when the validator rejects', async () => {
      const f = await mount('on-validation.bind="validate"', { validate: notEmpty });

      f.dblclick();
      await flush();
      f.type('   ');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.isNull(f.input(), 'the default invalid action closes the input');
    });

    it('reports the rejected text to the failure hook', async () => {
      const rejected: string[] = [];
      const f = await mount(
        'on-validation.bind="validate" on-validation-fail.bind="report"',
        { validate: notEmpty, report: (text: string) => rejected.push(text) },
      );

      f.dblclick();
      await flush();
      f.type('  ');
      f.press('Enter');
      await flush();

      assert.deepStrictEqual(rejected, ['  ']);
    });

    it('holds the input open when the invalid action is edit-mode', async () => {
      const f = await mount(
        'on-validation.bind="validate" edit-invalid-action="edit-mode"',
        { validate: notEmpty },
      );

      f.dblclick();
      await flush();
      f.type('');
      f.press('Enter');
      await flush();

      assert.isNotNull(f.input(), 'the input should stay open for correction');
      assert.strictEqual(f.model.label, 'original');
    });

    it('commits a correction made without leaving edit mode', async () => {
      const f = await mount(
        'on-validation.bind="validate" edit-invalid-action="edit-mode"',
        { validate: notEmpty },
      );

      f.dblclick();
      await flush();
      f.type('');
      f.press('Enter');
      await flush();

      f.type('corrected');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'corrected');
      assert.isNull(f.input());
    });

    it('accepts the object form of a validator result', async () => {
      const f = await mount('on-validation.bind="validate"', {
        validate: (text: string) => ({ valid: text.trim().length > 0 }),
      });

      f.dblclick();
      await flush();
      f.type('valid');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'valid');
    });

    it('rejects through the object form of a validator result', async () => {
      const f = await mount('on-validation.bind="validate"', {
        validate: (text: string) => ({ valid: text.trim().length > 0 }),
      });

      f.dblclick();
      await flush();
      f.type('  ');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'original');
    });

    it('commits the replacement text the validator supplies', async () => {
      const f = await mount('on-validation.bind="validate"', {
        validate: (text: string) => ({ valid: true, text: text.trim() === '' ? 'none' : text }),
      });

      f.dblclick();
      await flush();
      f.type('');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'none');
      assert.isNull(f.input(), 'an accepted edit closes the input');
    });

    it('commits the text as typed when the validator omits a replacement', async () => {
      const f = await mount('on-validation.bind="validate"', {
        validate: () => ({ valid: true }),
      });

      f.dblclick();
      await flush();
      f.type('as typed');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, 'as typed');
    });

    it('seeds the open input with the replacement text under edit-mode', async () => {
      const f = await mount(
        'on-validation.bind="validate" edit-invalid-action="edit-mode"',
        { validate: (text: string) => ({ valid: false, text: `${text.trim()}.00` }) },
      );

      f.dblclick();
      await flush();
      f.type('10');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.openInput().value, '10.00', 'the suggestion should be offered');
      assert.strictEqual(f.model.label, 'original', 'a rejected edit must not commit');
    });

    it('commits the validator suggestion once it is accepted', async () => {
      let attempts = 0;
      const f = await mount(
        'on-validation.bind="validate" edit-invalid-action="edit-mode"',
        {
          // Rejects the first attempt with a suggestion, then accepts it.
          validate: (text: string) => (++attempts === 1
            ? { valid: false, text: `${text}.00` }
            : { valid: true }),
        },
      );

      f.dblclick();
      await flush();
      f.type('10');
      f.press('Enter');
      await flush();
      f.press('Enter');
      await flush();

      assert.strictEqual(f.model.label, '10.00');
      assert.isNull(f.input());
    });

    it('leaves the open input untouched when a rejection offers no replacement', async () => {
      const f = await mount(
        'on-validation.bind="validate" edit-invalid-action="edit-mode"',
        { validate: () => ({ valid: false }) },
      );

      f.dblclick();
      await flush();
      f.type('kept');
      f.press('Enter');
      await flush();

      assert.strictEqual(f.openInput().value, 'kept');
      assert.strictEqual(f.model.label, 'original');
    });

    it('reports the text as typed to the failure hook, not the replacement', async () => {
      const rejected: string[] = [];
      const f = await mount(
        'on-validation.bind="validate" on-validation-fail.bind="report"',
        {
          validate: (text: string) => ({ valid: false, text: `${text}!` }),
          report: (text: string) => rejected.push(text),
        },
      );

      f.dblclick();
      await flush();
      f.type('typed');
      f.press('Enter');
      await flush();

      assert.deepStrictEqual(rejected, ['typed']);
    });
  });

  describe('exit modes', () => {
    it('commits on blur by default', async () => {
      const f = await mount();

      f.dblclick();
      await flush();
      f.type('blurred');
      f.blur();
      await flush();

      assert.strictEqual(f.model.label, 'blurred');
    });

    it('discards on blur when the blur action is cancel', async () => {
      const f = await mount('edit-blur-action="cancel"');

      f.dblclick();
      await flush();
      f.type('dropped');
      f.blur();
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.isNull(f.input());
    });

    it('keeps the pending edit alive when the blur action is ignore', async () => {
      const f = await mount('edit-blur-action="ignore"');

      f.dblclick();
      await flush();
      f.type('still editing');
      f.blur();
      await flush();

      assert.strictEqual(f.openInput().value, 'still editing');
      assert.strictEqual(f.model.label, 'original');
    });

    it('makes Enter inert when the exit trigger is custom', async () => {
      const f = await mount('edit-exit-trigger="custom"');

      f.dblclick();
      await flush();
      f.type('typed');
      f.press('Enter');
      await flush();

      assert.isNotNull(f.input(), 'Enter should not exit edit mode');
      assert.strictEqual(f.model.label, 'original');
    });

    it('makes Escape inert when the exit trigger is custom', async () => {
      const f = await mount('edit-exit-trigger="custom"');

      f.dblclick();
      await flush();
      f.type('typed');
      f.press('Escape');
      await flush();

      assert.isNotNull(f.input(), 'Escape should not exit edit mode');
      assert.strictEqual(f.model.label, 'original');
    });
  });

  describe('imperative API', () => {
    it('opens edit mode from startEdit()', async () => {
      const f = await mount('edit-trigger="custom"');

      f.component.startEdit();
      await flush();

      assert.isTrue(f.component.editing);
      assert.strictEqual(f.openInput().value, 'original');
    });

    it('commits from applyEdit()', async () => {
      const f = await mount('edit-trigger="custom" edit-exit-trigger="custom"');

      f.component.startEdit();
      await flush();
      f.type('applied');
      f.component.applyEdit();
      await flush();

      assert.strictEqual(f.model.label, 'applied');
      assert.isFalse(f.component.editing);
    });

    it('discards from cancelEdit()', async () => {
      const f = await mount('edit-trigger="custom" edit-exit-trigger="custom"');

      f.component.startEdit();
      await flush();
      f.type('discarded');
      f.component.cancelEdit();
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.isFalse(f.component.editing);
    });

    it('does not re-commit a discarded edit when the torn-down input blurs', async () => {
      // A real browser fires blur when the focused input is removed from the
      // DOM; jsdom does not. Escape plus the default blur action of `apply`
      // would otherwise re-commit the text that was just discarded.
      const f = await mount();

      f.dblclick();
      await flush();
      const input = f.openInput();
      f.type('discarded');
      f.press('Escape');
      await flush();

      input.dispatchEvent(new Event('blur', { bubbles: false }));
      await flush();

      assert.strictEqual(f.model.label, 'original');
      assert.isFalse(f.component.editing);
    });
  });
});
