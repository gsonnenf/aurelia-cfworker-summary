import type { Meta, StoryObj } from '@aurelia/storybook';
import { CustomElement } from 'aurelia';
import '../services/ui/aurelia-headless/headless-tokens.css';
import '../services/ui/aurelia-headless/ui-segmented-control.css';

/**
 * The component that gets composed at runtime. Defined once at module scope
 * rather than inside the host: Aurelia reuses a single definition instead of
 * building a new one per view model instance.
 *
 * `ui-segmented-control` and `ui-segment` resolve as global resources because
 * `.storybook/preview.ts` registers `AureliaHeadlessConfiguration`.
 *
 * Headless ships no CSS of its own. The stylesheets are hand-written against
 * the same selectors and tokens as the headless-tailwind theme, and are
 * imported as modules at the top of this file rather than with an `<import>`
 * tag: the Vite plugin only rewrites those inside .html files, and this
 * template is a string.
 */
const SegmentedPanel = CustomElement.define(
  {
    name: 'segmented-panel',
    template: `
      <ui-segmented-control value.bind="choice" label="Pick a number">
        <ui-segment value.bind="1">1</ui-segment>
        <ui-segment value.bind="2">2</ui-segment>
        <ui-segment value.bind="3">3</ui-segment>
        <ui-segment value.bind="4">4</ui-segment>
      </ui-segmented-control>
      <p>Selected: \${choice === undefined ? 'nothing yet' : choice}</p>`,
  },
  class {
    /** Two-way bound from the control, to prove binding and not just mounting. */
    choice: number | undefined = undefined;
  }
);

/**
 * Host for the story: a button and an `au-compose`. The element sits in the
 * template from the start and renders nothing while `composed` is undefined.
 * Pressing the button assigns the component, which is what triggers the
 * composition.
 */
const DynamicTestHost = CustomElement.define(
  {
    name: 'dynamic-test-host',
    template: `
      <div style="padding: 1rem; font-family: system-ui, sans-serif;">
        <button click.trigger="insert()">Insert segmented control</button>
        <div style="margin-top: 1rem;">
          <au-compose component.bind="composed"></au-compose>
        </div>
      </div>`,
  },
  class {
    /** Undefined until the button is pressed; `au-compose` renders nothing. */
    composed: unknown = undefined;

    insert() {
      this.composed = SegmentedPanel;
    }
  }
);

const meta: Meta = {
  title: 'Experiments/DynamicTestAh',
  render: () => ({ Component: DynamicTestHost }),
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
