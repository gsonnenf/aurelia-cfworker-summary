import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import aurelia from "@aurelia/vite-plugin";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    watch: false,
    projects: [
      {
        // Existing jsdom unit test suite (test/*.spec.ts), unchanged behaviour.
        extends: "./vite.config.ts",
        test: {
          name: "unit",
          environment: "jsdom",
          root: dirname,
          setupFiles: ["./test/setup.ts"],
        },
      },
      {
        // Storybook's Vitest addon: runs every story as a test in real Chromium.
        // Deliberately NOT extending './vite.config.ts' here: that config also
        // applies vite-plugin-node-polyfills (needed for the Storybook preview
        // bundle's Buffer usage), which rewrites node:process/node:fs/node:child_process
        // imports and breaks addon-vitest's own Node-side setup script. Bring in
        // just the one Aurelia plugin instance instead.
        esbuild: { target: "es2022" },
        plugins: [
          aurelia({ useDev: true }),
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
