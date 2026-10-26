import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('real red → locator-only repair → green',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Run broken test/}).click();
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 await page.getByRole('button',{name:/Suggest repair/}).click();await expect(page.getByTestId('patch')).toContainText("getByTestId('save-profile')");
 await page.getByRole('button',{name:/Apply \+ rerun/}).click();await expect(page.getByTestId('green-output')).toContainText('1 passed',{timeout:30000});
 expect(await readFile('fixtures/tests/save.spec.ts','utf8')).toContain("toHaveText('Saved successfully')");
 expect(JSON.parse(await readFile('artifacts/red/result.json','utf8')).exitCode).not.toBe(0);
 expect(JSON.parse(await readFile('artifacts/green/result.json','utf8')).exitCode).toBe(0);
 await page.screenshot({path:'artifacts/verified.png',fullPage:true});
});
