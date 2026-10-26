import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {original,oldLocator,newLocator} from '../server/repair';
test('V1 and V2 preserve save behavior',async({page})=>{
 for(const version of ['v1','v2']){
  await page.goto(`http://127.0.0.1:5210/fixture/${version}`);
  await expect(page.getByRole('status')).toHaveText('尚未保存');
  await page.getByRole('button',{name:'保存资料'}).click();
  await expect(page.getByRole('status')).toHaveText('保存成功');
 }
});
test('real repair preserves full source and supports repeat',async({page,request})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/运行失败测试/}).click();
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 await expect(page.getByTestId('red-output')).toContainText("getByTestId('save-user')");
 expect((await request.post('http://127.0.0.1:5210/api/apply')).status()).toBe(400);
 await page.getByRole('button',{name:/获取修复建议/}).click();
 await expect(page.getByTestId('patch')).toContainText("getByTestId('save-profile')",{timeout:30000});
 await page.getByRole('button',{name:/应用并重新验证/}).click();
 await expect(page.getByTestId('green-output')).toContainText('1 passed',{timeout:30000});
 expect(await readFile('fixtures/tests/save.spec.ts','utf8')).toBe(original.replace(oldLocator,newLocator));
 expect(JSON.parse(await readFile('artifacts/red/result.json','utf8')).exitCode).toBe(1);
 expect(JSON.parse(await readFile('artifacts/green/result.json','utf8')).exitCode).toBe(0);
 expect(await readFile('artifacts/green/repair.diff','utf8')).toContain("+  await page.getByTestId('save-profile')");
 const resetResponse=page.waitForResponse(r=>r.url().endsWith('/api/run')&&r.request().method()==='POST');
 await page.getByRole('button',{name:/运行失败测试/}).click();
 expect((await resetResponse).status()).toBe(200);
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 expect(await readFile('fixtures/tests/save.spec.ts','utf8')).toBe(original);
});

test('中文小屏与键盘入口',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
 await expect(page.getByText('本地样例 · 启发式规则 / 无 AI 推理')).toBeVisible();
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'跳到代码审阅'})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(page.getByRole('button',{name:/运行失败测试/})).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 const response=await request.post('http://127.0.0.1:5210/api/invalid');
 expect(response.status()).toBe(404);expect((await response.json()).error).toBe('不支持此操作。');
 await page.screenshot({path:'artifacts/zh-mobile.png',fullPage:true});
});


test('empty, pending and recoverable network error states',async({page})=>{
 await page.goto('/');
 const run=page.getByRole('button',{name:/运行失败测试/});
 await expect(page.getByTestId('red-output')).toContainText('尚无执行结果');
 await expect(page.getByRole('button',{name:/获取修复建议/})).toBeDisabled();
 let release!:()=>void;
 const pending=new Promise<void>(resolve=>{release=resolve});
 await page.route('**/api/run',async route=>{await pending;await route.abort('failed')});
 await run.click();
 await expect(page.getByRole('button',{name:/正在运行浏览器/})).toBeDisabled();
 await expect(page.getByRole('status')).toHaveText('正在执行');
 release();
 await expect(page.getByRole('alert')).toContainText('操作未完成');
 await expect(run).toBeEnabled();
 await expect(page.getByTestId('green-output')).toContainText('等待应用补丁');
 await page.unroute('**/api/run');
 await run.click();
 await expect(page.getByTestId('red-output')).toContainText('1 failed',{timeout:30000});
 await expect(page.getByRole('alert')).toHaveCount(0);
});
