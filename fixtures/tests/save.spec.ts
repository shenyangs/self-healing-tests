import { test, expect } from '@playwright/test';
test('save profile preserves behavior', async ({ page }) => {
  await page.goto('http://127.0.0.1:5210/fixture/v2');
  await page.getByTestId('save-user').click({ timeout: 1500 });
  await expect(page.getByRole('status')).toHaveText('Saved successfully');
});
