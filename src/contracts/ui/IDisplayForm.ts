import { DI } from 'aurelia';
import type { RegistryKey } from './IDisplayMessage';

/**
 * One free-text field in a form: its label and, optionally, the value it
 * starts with. An absent `value` means the field opens empty.
 */
export interface FormTextField {
  label: string;
  value?: string;
}

/**
 * Collects free text from the user. Where `IUiMessageDisplay` tells the user
 * something or asks for a yes/no, this asks them to type.
 *
 * Forms here are always modal: a half-filled form the user can click away
 * from has no sensible outcome.
 *
 * The token has no default implementation on purpose — binding one here would
 * pull a renderer (and its vendor SDK) into every consumer of this contract.
 * Register the implementation at startup instead:
 *
 * ```ts
 * Aurelia.register(Registration.singleton(IDisplayForm, DisplayFormSw))
 * ```
 */
export interface IDisplayForm {
  /**
   * Shows two text fields stacked vertically, with a submit and a cancel
   * button.
   *
   * The fields are deliberately unnamed beyond `field1`/`field2`: this is a
   * generic form renderer, and what the two values mean belongs to the
   * caller, which maps them onto its own model.
   *
   * @param options Title, the two fields, and text for the two buttons.
   * @param callerIdentifier The control, component or element that raised it.
   *   Either an instance (`this`) or its class, so a display can key
   *   per-caller settings off whichever it has config for.
   * @returns The two values if the user submitted, `undefined` if they
   *   cancelled or dismissed the form.
   */
  displayTwoTextForm(
    options: {
      titleText: string;
      field1: FormTextField;
      field2: FormTextField;
      submitText?: string; //Default Submit
      cancelText?: string; //Default Cancel
    },
    callerIdentifier?: RegistryKey
  ): Promise<{ text1: string; text2: string } | undefined>;
}

export const IDisplayForm = DI.createInterface<IDisplayForm>('IDisplayForm');
