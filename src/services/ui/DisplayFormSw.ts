import Swal from 'sweetalert2';
import type { SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
// After the vendor sheet, so its `--swal2-*` defaults are the ones overridden.
import './DisplayFormSw.css';
import type { FormTextField, IDisplayForm } from '../../contracts/ui/IDisplayForm';

/** Ids for the generated fields, used to read their values back. */
const TEXT1_ID = 'app-form-text1';
const TEXT2_ID = 'app-form-text2';

/**
 * Settings shared by every form.
 *
 * Not built on the toast or confirm bases in `DisplayMessageSw`: a form is
 * never a toast, and unlike a confirmation it has no destructive default to
 * steer the user away from, so focus starts in the first field rather than on
 * Cancel.
 */
const FORM_BASE = {
  showCancelButton: true,
  // Submit on the right, matching OS dialog convention.
  reverseButtons: true,
  // A half-filled form has no sensible outcome, so it cannot be dismissed by
  // clicking away. Escape still cancels, which users expect of a form.
  allowOutsideClick: false,
  // sweetalert2 focuses the confirm button by default; the first field is
  // where typing should start.
  focusConfirm: false,
  // Drops the vendor's `swal2-styled` class, leaving plain <button>s that the
  // browser renders as its own native controls. This also makes
  // confirmButtonColor/cancelButtonColor inert, so they are not set.
  buttonsStyling: false,
  // Scope for DisplayFormSw.css, so nothing here reaches the toasts and
  // confirmations that share the same vendor classes.
  customClass: { popup: 'app-form' },
} satisfies SweetAlertOptions;

/**
 * Escapes text destined for markup. Labels come from the caller, so they are
 * not trusted as HTML.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class DisplayFormSw implements IDisplayForm {

  /****************************************************************************
   *                              Two Text Form                               *
   ***************************************************************************/

  async displayTwoTextForm(
    options: {
      titleText: string;
      field1: FormTextField;
      field2: FormTextField;
      submitText?: string;
      cancelText?: string;
    }
  ): Promise<{ text1: string; text2: string } | undefined> {
    return await this._fireTwoTextForm(options);
  }

  private async _fireTwoTextForm(options: {
    titleText: string;
    field1: FormTextField;
    field2: FormTextField;
    submitText?: string;
    cancelText?: string;
  }): Promise<{ text1: string; text2: string } | undefined> {
    const config = {
      ...FORM_BASE,
      title: options.titleText,
      html: `
        <div class="app-form-field">
          <label for="${TEXT1_ID}">${escapeHtml(options.field1.label)}</label>
          <textarea id="${TEXT1_ID}" rows="4"></textarea>
        </div>
        <div class="app-form-field">
          <label for="${TEXT2_ID}">${escapeHtml(options.field2.label)}</label>
          <textarea id="${TEXT2_ID}" rows="4"></textarea>
        </div>`,
      confirmButtonText: options.submitText ?? 'Submit',
      cancelButtonText: options.cancelText ?? 'Cancel',
      // Starting values are assigned rather than interpolated into the markup
      // above: a <textarea>'s initial content is parsed as HTML, and its
      // leading whitespace is significant.
      didOpen: () => {
        const text1 = document.getElementById(TEXT1_ID) as HTMLTextAreaElement;
        const text2 = document.getElementById(TEXT2_ID) as HTMLTextAreaElement;
        text1.value = options.field1.value ?? '';
        text2.value = options.field2.value ?? '';
        text1.focus();
      },
      // No validation yet. Returning the values here is what puts them on
      // `result.value`, and is where a `showValidationMessage` check would go.
      preConfirm: () => ({
        text1: (document.getElementById(TEXT1_ID) as HTMLTextAreaElement).value,
        text2: (document.getElementById(TEXT2_ID) as HTMLTextAreaElement).value,
      }),
    } satisfies SweetAlertOptions;

    const result = await Swal.fire(config);

    return result.isConfirmed ? result.value : undefined;
  }

}
