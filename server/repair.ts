export const allowedPath = 'fixtures/tests/save.spec.ts';
export const oldLocator = "getByTestId('save-user')";
export const newLocator = "getByTestId('save-profile')";
export const original = `import { test, expect } from '@playwright/test';
test('save profile preserves behavior', async ({ page }) => {
  await page.goto('http://127.0.0.1:5210/fixture/v2');
  await page.getByTestId('save-user').click({ timeout: 1500 });
  await expect(page.getByRole('status')).toHaveText('Saved successfully');
});
`;
export function validatePatch(path: string, before: string, after: string) {
  if(path !== allowedPath || before !== original || after !== original.replace(oldLocator,newLocator)) throw new Error('Rejected: only the allowlisted locator replacement is permitted');
  return after;
}
