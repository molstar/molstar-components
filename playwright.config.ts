import { defineConfig, devices } from '@playwright/test';

/**
 * e2e config for the docs demo app (docs/state-builder-docs.html and
 * docs/index.html). Run `deno task test:e2e:install` once to fetch the
 * Chromium binary, then `deno task test:e2e` to run the suite — this
 * builds the docs bundle and serves it automatically (see `webServer`
 * below), so there's no need to run `deno task dev` separately first.
 */
export default defineConfig({
  testDir: './e2e',
  // Each test loads a full Molstar (WebGL) + Monaco instance. Headless
  // Chromium in this environment falls back to software-rendered WebGL
  // (no GPU passthrough), which is CPU-heavy enough that running several
  // of these pages concurrently starves the browser's own event dispatch
  // and causes spurious action timeouts. Serial execution avoids that.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: !!Deno.env.get('CI'),
  retries: Deno.env.get('CI') ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'deno task build && deno task serve',
    url: 'http://127.0.0.1:8000/state-builder-docs.html',
    reuseExistingServer: !Deno.env.get('CI'),
    timeout: 120_000,
  },
});
