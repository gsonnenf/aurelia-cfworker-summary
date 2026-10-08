import Swal from 'sweetalert2';
import type { SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { DisplayType } from '../../contracts/ui/IDisplayMessage';
import type { IDisplayMessage, RegistryKey } from '../../contracts/ui/IDisplayMessage';

/**
 * Default toast settings per {@link DisplayType}. Computed keys make this a
 * compile error until a newly added enum member is given its own entry.
 *
 * `timer: undefined` means the toast stays until the user dismisses it.
 */
const TOAST_DEFAULTS: Record<DisplayType, SweetAlertOptions> = {
  [DisplayType.Info]: {
    icon: 'info',
    timer: 3000,
    background: '#eff6ff',
    color: '#1e3a8a',
    iconColor: '#2563eb',
  },
  [DisplayType.Pending]: {
    // No icon: a spinner stands in for one, and nothing auto-dismisses a
    // toast whose outcome is still unknown.
    timer: undefined,
    showCloseButton: true,
    background: '#f8fafc',
    color: '#334155',
    didOpen: () => Swal.showLoading(),
  },
  [DisplayType.Success]: {
    icon: 'success',
    timer: 3000,
    background: '#ecfdf5',
    color: '#065f46',
    iconColor: '#059669',
  },
  [DisplayType.Fail]: {
    // The action did not complete, but nothing is broken — warn, don't alarm.
    // Orange rather than Warning's yellow, so the two are not mistaken for
    // each other at a glance.
    icon: 'warning',
    timer: 4000,
    background: '#fff7ed',
    color: '#7c2d12',
    iconColor: '#ea580c',
  },
  [DisplayType.Warning]: {
    icon: 'warning',
    timer: 4000,
    showCloseButton: true,
    background: '#fefce8',
    color: '#713f12',
    iconColor: '#ca8a04',
  },
  [DisplayType.Error]: {
    icon: 'error',
    timer: 6000,
    showCloseButton: true,
    background: '#fef2f2',
    color: '#7f1d1d',
    iconColor: '#dc2626',
  },
  [DisplayType.Critical]: {
    // Compromised application or data: no timer, and the user has to
    // acknowledge it before it goes away. Colors are inverted against every
    // other type so it cannot be confused with an ordinary error.
    icon: 'error',
    timer: undefined,
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: 'Dismiss',
    background: '#7f1d1d',
    color: '#fff5f5',
    iconColor: '#fca5a5',
    confirmButtonColor: '#b91c1c',
  },
};

/** Settings shared by every toast, regardless of type. */
const TOAST_BASE: SweetAlertOptions = {
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  showCloseButton: false,
};

export type DisplayMessageHandler = (message: string,displayType: DisplayType) => Promise<void> | void;

export class DisplayMessageSw implements IDisplayMessage {
  private readonly swal = Swal.mixin(TOAST_BASE);

  private readonly callerOverrides = new Map<RegistryKey, DisplayMessageHandler>();

  registerCaller(callerIdentifier: RegistryKey, handler: DisplayMessageHandler) {
    this.callerOverrides.set(callerIdentifier, handler);
    return () => this.callerOverrides.delete(callerIdentifier);
  }

  async displayMessage( message: string, displayType: DisplayType, callerIdentifier?: RegistryKey ): Promise<void> {
    const overrideCallback = (callerIdentifier === undefined) ? undefined : this.callerOverrides.get(callerIdentifier);
    if (overrideCallback) await overrideCallback(message, displayType);
    else await this.fire(message, displayType);
  }

  /** Fires one toast from its type's defaults. */
  private async fire(message: string, displayType: DisplayType) {
    await this.swal.fire({
      ...TOAST_DEFAULTS[displayType],
      title: message,
    });
  }
}
