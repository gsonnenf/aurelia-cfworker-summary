import { DI } from 'aurelia';

/**
 * How a message should be displayed. One member per display treatment, in
 * ascending order of how much it demands of the user.
 *
 * - `info`     neutral; something the user may want to know
 * - `pending`  an action is underway, outcome not yet known
 * - `success`  the action completed
 * - 'fail'     the action was unable to be completed
 * - `warning`  something concerning is occuring, but application is still functioing
 * - `error`    something failed in an unexpected way that compromised the action
 * - `critical` a serious failure that indicates compromised application or data
 */

export enum DisplayType {
  Info = 'info',
  Pending = 'pending',
  Success = 'success',
  Fail = 'fail',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

/**
 * A key usable to register and look up per-caller config, such as an
 * instance (`this`) or its class.
 */
export type RegistryKey = string | symbol | object;

/**
 * Displays a message to the user. Callers say what happened and which
 * treatment it asks for; the implementation owns everything about how that
 * is rendered.
 *
 * The token has no default implementation on purpose — binding one here would
 * pull a renderer (and its vendor SDK) into every consumer of this contract.
 * Register the implementation at startup instead:
 *
 * ```ts
 * Aurelia.register(Registration.singleton(IDisplayMessage, DisplayMessageSw))
 * ```
 */
export interface IDisplayMessage {
  /**
   * @param message What the user reads.
   * @param displayType Which display treatment it gets.
   * @param callerIdentifier The control, component or element that raised it.
   *   Either an instance (`this`) or its class, so a display can key
   *   per-caller settings off whichever it has config for.
   * @returns Resolves once the message has been shown and dismissed.
   */
  displayMessage(
    message: string,
    displayType: DisplayType,
    callerIdentifier?: RegistryKey
  ): Promise<void>;
}

export const IDisplayMessage = DI.createInterface<IDisplayMessage>('IDisplayMessage');
