// Import the render function from the Aurelia Storybook plugin
export { render, renderToCanvas } from '@aurelia/storybook';

import type { Preview } from '@aurelia/storybook';
import { AureliaHeadlessConfiguration } from '@aurelia-ui-toolkits/headless';

// Storybook never loads src/main.ts, so plugins the app registers there have
// to be registered again here to be available to every story.
const preview = {
  parameters: {
    aurelia: {
      register: [AureliaHeadlessConfiguration],
    },
  },
} satisfies Preview;

export default preview; 