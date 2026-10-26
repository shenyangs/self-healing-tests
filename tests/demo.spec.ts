import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('real red → locator-only repair → green',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/运行失败测试/}).click();
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 await page.getByRole('button',{name:/获取修复建议/}).click();await expect(page.getByTestId('patch')).toContainText("getByTestId('save-profile')");
 await page.getByRole('button',{name:/应用并重新验证/}).click();await expect(page.getByTestId('green-output')).toContainText('1 passed',{timeout:30000});
 expect(await readFile('fixtures/tests/save.spec.ts','utf8')).toContain("toHaveText('保存成功')");
 expect(JSON.parse(await readFile('artifacts/red/result.json','utf8')).exitCode).not.toBe(0);
 expect(JSON.parse(await readFile('artifacts/green/result.json','utf8')).exitCode).toBe(0);
 await page.screenshot({path:'artifacts/verified.png',fullPage:true});
});
