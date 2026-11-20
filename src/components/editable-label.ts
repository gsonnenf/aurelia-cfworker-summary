import { BindingMode, bindable, resolve } from 'aurelia';

/** Which keys exit edit mode. `custom` switches the built-in keys off. */
export type EditExitTrigger = 'default' | 'custom';
/** Which element edits the text. */
export type EditElement = 'input' | 'textarea';
/** What a focus change does to a pending edit. */
export type EditBlurAction = 'apply' | 'cancel' | 'ignore';
/** What a failed validation does to a pending edit. */
export type EditInvalidAction = 'cancel' | 'edit-mode';

/**
 * What a validator reports.
 *
 * A bare boolean accepts or rejects the text as typed. The object form can
 * also replace it: `text` is applied whenever it is present, both when the
 * edit is accepted and when it is rejected under
 * `edit-invalid-action="edit-mode"`, where it becomes a suggested correction
 * in the still-open input. Omit `text` to keep the text as typed.
 */
export type EditValidation = boolean | { valid: boolean; text?: string };

interface EditGesture {
  /** DOM event name, e.g. `dblclick`. */
  event: string;
  /** `KeyboardEvent.key` value when the gesture is keyed, otherwise undefined. */
  key?: string;
}

/**
 * A text element that can be edited in place.
 *
 * The pending text lives in `draft` while editing, so `value` only changes when
 * the edit is applied.
 */
export class EditableLabel {
  /** The text. Two-way by default, so `value.bind` is enough. */
  @bindable({ mode: BindingMode.twoWay }) value = '';

  /**
   * Gestures that enter edit mode: any DOM event name, optionally `:key`.
   * e.g. `dblclick keydown:F5 keydown:Enter`. `custom` to drive it via
   * `startEdit()`.
   */
  @bindable editTrigger = 'dblclick';
  /**
   * `textarea` edits the text in a wrapping, multi-line editor. It also moves
   * the apply key, since Enter has to stay available for a line break.
   */
  @bindable editElement: EditElement = 'input';
  @bindable editBlurAction: EditBlurAction = 'apply';
  @bindable editExitTrigger: EditExitTrigger = 'default';
  @bindable editInvalidAction: EditInvalidAction = 'cancel';

  /**
   * Return `true`, or `{ valid: true }`, to accept the pending text. Return
   * `{ valid, text }` to replace it as well. See `EditValidation`.
   */
  @bindable onValidation?: (text: string) => EditValidation;
  /** Called each time the validator rejects. */
  @bindable onValidationFail?: (text: string) => void;

  /** `true` while the input is open. Readonly to the host. */
  editing = false;

  /** The pending text, bound to the input. */
  draft = '';

  /**
   * Set by the template. Whichever editor `editElement` selected.
   *
   * Nullable as well as optional: Aurelia's ref binding assigns `null` when
   * the editor is torn down, so this is `undefined` only before the first
   * edit.
   */
  inputEl?: HTMLInputElement | HTMLTextAreaElement | null;

  private readonly host: HTMLElement = resolve(Element) as HTMLElement;
  private gestures: EditGesture[] = [];
  private listening = false;
  /** Set while we move focus back into the input ourselves. */
  private ignoreBlur = false;

  /** True when a key gesture is configured, so the text needs to be focusable. */
  get needsTabIndex(): boolean {
    return this.gestures.some(g => g.key !== undefined);
  }

  /** Drives the template's choice of editor. */
  get isTextarea(): boolean {
    return this.editElement === 'textarea';
  }

  attaching(): void {
    this.parseTriggers();
    this.addTriggerListeners();
  }

  detaching(): void {
    this.removeTriggerListeners();
  }

  editTriggerChanged(): void {
    this.removeTriggerListeners();
    this.parseTriggers();
    this.addTriggerListeners();
  }

  /** Enter edit mode with a copy of the current value. */
  startEdit(): void {
    if (this.editing) return;
    this.draft = this.value;
    this.editing = true;
    this.focusInput();
  }

  /** Validate the pending text and, if it passes, write it back to `value`. */
  applyEdit(): void {
    if (!this.editing) return;
    // The text as typed. The validator may replace it, but the failure hook
    // and `edit-mode` both report on what the user actually entered.
    const typed = this.draft;
    const result = this.onValidation?.(typed) ?? true;
    const valid = typeof result === 'boolean' ? result : result.valid;
    // A replacement only applies when the validator supplies one.
    const text = typeof result === 'boolean' ? typed : result.text ?? typed;

    if (!valid) {
      this.onValidationFail?.(typed);
      if (this.editInvalidAction === 'edit-mode') {
        // Keep the input open so the user can correct the entry, seeded with
        // the validator's suggestion when it offered one.
        this.draft = text;
        this.focusInput();
        return;
      }
      this.cancelEdit();
      return;
    }

    this.value = text;
    this.editing = false;
  }

  /** Leave edit mode and discard the pending text. */
  cancelEdit(): void {
    if (!this.editing) return;
    this.draft = this.value;
    this.editing = false;
  }

  /** Bound in the template on the input. */
  onInputKeydown(event: KeyboardEvent): void {
    if (this.editExitTrigger !== 'default') return;
    if (event.key === 'Enter') {
      // Shift+Enter is the line break in a textarea, so it falls through
      // unhandled and the browser inserts it.
      if (this.isTextarea && event.shiftKey) return;
      event.preventDefault();
      this.applyEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  /** Bound in the template on the textarea, to keep it fitted as text is typed. */
  onInputInput(): void {
    this.autoGrow();
  }

  /** Bound in the template on the input. */
  onInputBlur(): void {
    if (this.ignoreBlur || !this.editing) return;
    switch (this.editBlurAction) {
      case 'apply':
        this.applyEdit();
        break;
      case 'cancel':
        this.cancelEdit();
        break;
      case 'ignore':
        break;
    }
  }

  private parseTriggers(): void {
    const spec = (this.editTrigger ?? '').trim();
    if (spec === '' || spec === 'custom') {
      this.gestures = [];
      return;
    }
    this.gestures = spec.split(/\s+/).map(part => {
      const separator = part.indexOf(':');
      return separator === -1
        ? { event: part }
        // Key names are `KeyboardEvent.key` values, so they stay case-sensitive.
        : { event: part.slice(0, separator), key: part.slice(separator + 1) };
    });
  }

  private readonly handleTrigger = (event: Event): void => {
    // The input lives inside the host, so its own events bubble up here too.
    if (this.editing) return;

    for (const gesture of this.gestures) {
      if (gesture.event !== event.type) continue;
      if (gesture.key !== undefined && (event as KeyboardEvent).key !== gesture.key) continue;
      // Keep the browser menu from covering the input.
      if (event.type === 'contextmenu') event.preventDefault();
      this.startEdit();
      return;
    }
  };

  private addTriggerListeners(): void {
    if (this.listening) return;
    for (const name of this.triggerEventNames()) {
      this.host.addEventListener(name, this.handleTrigger);
    }
    this.listening = this.gestures.length > 0;
  }

  private removeTriggerListeners(): void {
    for (const name of this.triggerEventNames()) {
      this.host.removeEventListener(name, this.handleTrigger);
    }
    this.listening = false;
  }

  private triggerEventNames(): string[] {
    return [...new Set(this.gestures.map(g => g.event))];
  }

  private focusInput(): void {
    this.ignoreBlur = true;
    const focus = (): void => {
      this.inputEl?.focus();
      this.inputEl?.select();
      this.autoGrow();
      this.ignoreBlur = false;
    };
    // The input is rendered by `if.bind`, so wait for that to flush. The ref
    // is `null` rather than `undefined` once an earlier editor has been torn
    // down, so both have to count as "not rendered yet".
    if (this.inputEl != null) {
      focus();
    } else {
      queueMicrotask(() => (this.inputEl != null ? focus() : requestAnimationFrame(focus)));
    }
  }

  /**
   * Fits a textarea to its content, so an edit opens showing all of the text
   * instead of a two-row window onto it. `auto` first, so deleting text
   * shrinks the box as well as growing it.
   */
  private autoGrow(): void {
    const el = this.inputEl;
    if (el == null || !this.isTextarea) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
