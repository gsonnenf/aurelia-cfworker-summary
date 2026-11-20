import type { EditableLabel } from './components/editable-label';

/**
 * Manual test bench for `<editable-label>`.
 *
 * Each block below is one example from `editable-label._spec.md`, kept
 * self-contained: the state an example needs sits next to the callbacks that
 * example uses, rather than all fields first and all methods after.
 */
export class MyApp {


  constructor() {
    // Dev hook: the live model objects, for console inspection of write-back.
    Object.assign(globalThis, {
      myApp: this
    });
  }
}
