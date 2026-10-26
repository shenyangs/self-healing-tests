import express from 'express';
import {configureBrowser} from '../scripts/browser.mjs';
import { createTwoFilesPatch } from 'diff';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { original, allowedPath, oldLocator, newLocator, validatePatch } from './repair';
const root = process.cwd();
const browserConfig=configureBrowser();
const app = express(); app.use(express.json({limit:'10kb'}));
app.use('/api/artifacts',express.static(path.join(root,'artifacts')));
app.get('/api/health', (_req,res) => res.json({ ok:true, project:'self-healing-tests' }));
app.get('/fixture/:version',(req,res)=>res.type('html').send(`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>资料保存样例</title><style>body{background:#101820;color:#e7f8f3;font:24px system-ui;padding:80px}button{background:#7cfac4;padding:18px;border:0;font:inherit;border-radius:8px}</style></head><body><small>本地样例 · ${req.params.version==='v1'?'V1':'V2'}</small><h1>个人资料设置</h1><p>修改已就绪，点击按钮保存。</p><button data-testid="${req.params.version==='v1'?'save-user':'save-profile'}" onclick="document.querySelector('[role=status]').textContent='保存成功'">保存资料</button><p role="status">尚未保存</p></body></html>`));
let busy = false;
let stage = 'idle';
let suggestion = false;
async function runTest(label:string) {
 const dir = `artifacts/${label}`; await mkdir(dir,{recursive:true});
 const result = await new Promise<{exitCode:number,output:string}>((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(root,'node_modules/@playwright/test/cli.js'),'test','--config=fixtures/playwright.config.ts',`--output=${dir}`],{cwd:root,env:{...process.env,FORCE_COLOR:'0',NO_COLOR:undefined}});
  let output=''; const timer=setTimeout(()=>child.kill('SIGTERM'),25000);
  child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
  child.on('error',reject);child.on('close',code=>{clearTimeout(timer);resolve({exitCode:code??1,output:output.slice(-20000)})});
 });
 await writeFile(`${dir}/source.ts`, await readFile(allowedPath,'utf8'));
 await writeFile(`${dir}/run.log`, result.output);
 await writeFile(`${dir}/result.json`,JSON.stringify(result,null,2));
 return {...result,evidence:dir};
}
app.post('/api/:action',async(req,res)=>{
 if(busy){res.status(409).json({error:'已有操作正在执行，请稍候再试。'});return;}busy=true;
 try {
 const action=req.params.action;
 if(action==='run'){
  await mkdir('fixtures/tests',{recursive:true});await writeFile(allowedPath,original);suggestion=false;
  const result=await runTest('red');stage=result.exitCode!==0 && result.output.includes("getByTestId('save-user')") && result.output.includes('Timeout')?'red':'unexpected';res.json({...result,stage,assertion:"toHaveText('保存成功')"});
 }else if(action==='suggest'){
  if(stage!=='red')throw new Error('请先运行失败测试。');
  const browser=await chromium.launch({executablePath:browserConfig.executablePath,timeout:10000});
  let payload;
  try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5210/fixture/v2');
   const candidate=page.getByRole('button',{name:'保存资料',exact:true});
   if(await page.getByTestId('save-profile').count()!==1 || await candidate.count()!==1 || !await candidate.isEnabled() || !await candidate.isVisible() || await candidate.getAttribute('data-testid')!=='save-profile')throw new Error('未找到唯一可操作按钮，无法安全修复。');
   suggestion=true;payload={stage:'suggested',mode:'启发式规则 / 无 AI 推理',reason:'已确认唯一可见且可点击的“保存资料”按钮，其 data-testid 为 save-profile。',diff:`- page.${oldLocator}\n+ page.${newLocator}`,matches:1};
  }finally{await browser.close()}
  res.json(payload);
 }else if(action==='apply'){
  if(!suggestion||stage!=='red')throw new Error('请先获取并验证修复建议。');
  const before=await readFile(allowedPath,'utf8');const after=validatePatch(allowedPath,before,before.replace(oldLocator,newLocator));await writeFile(allowedPath,after);
  const result=await runTest('green');stage=result.exitCode===0?'green':'failed';suggestion=false;
  const diff=createTwoFilesPatch(allowedPath,allowedPath,before,after);
  await writeFile('artifacts/green/repair.diff',diff);
  await writeFile('artifacts/green/source-after.ts',after);
  res.json({...result,stage,diff,assertionUnchanged:after.replace(newLocator,oldLocator)===original,source:after});
 }else{res.status(404).json({error:'不支持此操作。'})}
 }catch(e){res.status(400).json({error:'操作失败，请检查浏览器安装或重新从第一步开始。详细原因：'+(e as Error).message})}finally{busy=false}
});
app.listen(5210,'127.0.0.1',()=>console.log('测试自修复实验室已启动。网页入口：http://127.0.0.1:4210；本地 API：http://127.0.0.1:5210/api/health'));
