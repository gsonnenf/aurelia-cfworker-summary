import type { Meta, StoryObj } from '@aurelia/storybook';
import { CustomElement, Registration, resolve } from 'aurelia';
import { IDisplayForm } from '../contracts/ui/IDisplayForm';
import { DisplayFormSw } from '../services/ui/DisplayFormSw';

/**
 * Host for the story: a button that opens the form, and a readout of what
 * came back. The service is injected rather than constructed, so the story
 * exercises the same DI path the app will use.
 *
 * Defined with `CustomElement.define` rather than written as a bare class:
 * the story passes it as `Component` with no `template` of its own, and the
 * renderer only treats the view model as the binding context when it builds
 * the markup from a custom element. Given both, its `template` wins and the
 * class is registered as a plain resource, leaving `showForm()` unreachable.
 *
 * The convention plugin pairs a template by filename, which a `.stories.ts`
 * has no half of, so the template is inline here.
 */
const DisplayFormHost = CustomElement.define(
  {
    name: 'display-form-host',
    template: `
      <div style="padding: 1rem; font-family: system-ui, sans-serif;">
        <button click.trigger="showForm()">Open form</button>
        <pre style="margin-top: 1rem;">\${result}</pre>
      </div>`,
  },
  class {
    private readonly displayForm = resolve(IDisplayForm);

    /** What the last run returned, as JSON. `cancelled` if it was dismissed. */
    result = '';

    async showForm() {
      const result = await this.displayForm.displayTwoTextForm(
        {
          titleText: 'New summary item',
          field1: { label: 'Message' },
          field2: { label: 'Summary' },
          submitText: 'Add',
        },
        this
      );
      this.result = result === undefined ? 'cancelled' : JSON.stringify(result, null, 2);
    }
  }
);

const meta: Meta = {
  title: 'Services/DisplayFormSw',
  render: () => ({
    Component: DisplayFormHost,
    // The app registers this in main.ts; the story registers it itself so it
    // stands alone.
    items: [Registration.singleton(IDisplayForm, DisplayFormSw)],
  }),
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
