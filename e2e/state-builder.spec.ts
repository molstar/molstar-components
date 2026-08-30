import { test, expect } from '@playwright/test';

/**
 * Targets the "State Builder" demo on the docs page (docs/docs.ts,
 * #demo-builder) — it mounts BuilderWithEditorAndViewer with a real
 * preloaded node tree (a 1opl structure with several component/
 * representation/color nodes), starting on the Builder tab. That gives
 * every test here a populated tree to interact with immediately, no
 * setup steps needed.
 */

test.describe('State Builder demo', () => {
  test('loads with no console errors and renders the preloaded tree', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    await page.goto('/state-builder-docs.html');
    const builder = page.locator('#demo-builder [data-ui-builder]');
    await expect(builder).toBeVisible();

    // 1opl demo tree: download/parse, model, transform, 3 components each with
    // representation + color/opacity children — see docs/docs.ts DEMO_BUILDER_MVS.
    const rows = builder.locator('button.bg-muted\\/40');
    await expect(rows).toHaveCount(15);

    expect(consoleErrors).toEqual([]);
  });

  test('opens a node helper and its Raw tab shows the node\'s params as JSON', async ({ page }) => {
    await page.goto('/state-builder-docs.html');
    const builder = page.locator('#demo-builder [data-ui-builder]');

    // Row 4 is the first "representation" node (type: cartoon) — see docs/docs.ts.
    const cartoonRow = builder.locator('button.bg-muted\\/40').nth(4);
    await expect(cartoonRow).toHaveText('cartoon');
    await cartoonRow.click();

    const dialog = page.locator('[data-slot=dialog-content]');
    await expect(dialog).toBeVisible();

    await dialog.getByText('Raw', { exact: true }).click();
    const rawTextarea = dialog.locator('textarea').first();
    await expect(rawTextarea).toBeVisible();

    const raw = await rawTextarea.inputValue();
    expect(JSON.parse(raw)).toEqual({ type: 'cartoon' });
  });

  test('undo/redo round-trips a node addition via the toolbar buttons', async ({ page }) => {
    await page.goto('/state-builder-docs.html');
    const builder = page.locator('#demo-builder [data-ui-builder]');
    const rows = builder.locator('button.bg-muted\\/40');
    await expect(rows).toHaveCount(15);

    const undoButton = builder.getByRole('button', { name: 'Undo (Ctrl+Z)' });
    const redoButton = builder.getByRole('button', { name: 'Redo (Ctrl+Y)' });
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();

    // Add Canvas Configuration via the toolbar "Add" menu — a single top-level
    // node, easy to assert on without touching the existing preloaded tree.
    await builder.getByRole('button', { name: 'Add', exact: false }).first().click();
    await page.getByRole('menuitem', { name: 'Canvas Configuration' }).click();

    await expect(rows).toHaveCount(16);
    await expect(undoButton).toBeEnabled();

    await undoButton.click();
    await expect(rows).toHaveCount(15);
    await expect(redoButton).toBeEnabled();

    await redoButton.click();
    await expect(rows).toHaveCount(16);
  });
});
