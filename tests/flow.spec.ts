import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {original,oldLocator,newLocator} from '../server/repair';
test('V1 and V2 preserve save behavior',async({page})=>{
 for(const version of ['v1','v2']){
  await page.goto(`http://127.0.0.1:5210/fixture/${version}`);
  await expect(page.getByRole('status')).toHaveText('Unsaved');
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByRole('status')).toHaveText('Saved successfully');
 }
});
test('real repair preserves full source and supports repeat',async({page,request})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Run broken test/}).click();
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 await expect(page.getByTestId('red-output')).toContainText("getByTestId('save-user')");
 expect((await request.post('http://127.0.0.1:5210/api/apply')).status()).toBe(400);
 await page.getByRole('button',{name:/Suggest repair/}).click();
 await expect(page.getByTestId('patch')).toContainText("getByTestId('save-profile')");
 await page.getByRole('button',{name:/Apply \+ rerun/}).click();
 await expect(page.getByTestId('green-output')).toContainText('1 passed',{timeout:30000});
 expect(await readFile('fixtures/tests/save.spec.ts','utf8')).toBe(original.replace(oldLocator,newLocator));
 expect(JSON.parse(await readFile('artifacts/red/result.json','utf8')).exitCode).toBe(1);
 expect(JSON.parse(await readFile('artifacts/green/result.json','utf8')).exitCode).toBe(0);
 expect(await readFile('artifacts/green/repair.diff','utf8')).toContain("+  await page.getByTestId('save-profile')");
 await page.getByRole('button',{name:/Run broken test/}).click();
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 expect(await readFile('fixtures/tests/save.spec.ts','utf8')).toBe(original);
});
