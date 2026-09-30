
import type { StorybookConfig } from 'storybook/internal/types';
import { mergeConfig, type InlineConfig } from 'vite';

const config: StorybookConfig & { viteFinal?: (config: InlineConfig, options: { configType: string }) => InlineConfig | Promise<InlineConfig> } = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@whitespace/storybook-addon-html', 
  ],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  viteFinal: async (viteConfig) => {
    viteConfig.optimizeDeps = viteConfig.optimizeDeps || {};
    viteConfig.optimizeDeps.exclude = viteConfig.optimizeDeps.exclude || [];
    const aureliaPackages = ['@aurelia/storybook', '@aurelia/runtime-html'];

    aureliaPackages.forEach((pkg) => {
      if (!viteConfig?.optimizeDeps?.exclude?.includes(pkg)) viteConfig?.optimizeDeps?.exclude?.push(pkg);
    });

    return mergeConfig(viteConfig, {
      // ...any additional Vite configuration
    });
  },
};

export default config;



