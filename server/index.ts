import express from 'express';
import { createTwoFilesPatch } from 'diff';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { original, allowedPath, oldLocator, newLocator, validatePatch } from './repair';
const root = process.cwd();
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.browsers');
const app = express(); app.use(express.json({limit:'10kb'}));
app.use('/api/artifacts',express.static(path.join(root,'artifacts')));
app.get('/api/health', (_req,res) => res.json({ ok:true, project:'self-healing-tests' }));
app.get('/fixture/:version',(req,res)=>res.type('html').send(`<!doctype html><html><head><title>Profile fixture</title><style>body{background:#101820;color:#e7f8f3;font:24px system-ui;padding:80px}button{background:#7cfac4;padding:18px;border:0;font:inherit;border-radius:8px}</style></head><body><small>LOCAL FIXTURE · ${req.params.version==='v1'?'V1':'V2'}</small><h1>Profile settings</h1><p>Your changes are ready.</p><button data-testid="${req.params.version==='v1'?'save-user':'save-profile'}" onclick="document.querySelector('[role=status]').textContent='Saved successfully'">Save profile</button><p role="status">Unsaved</p></body></html>`));
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
 if(busy){res.status(409).json({error:'A run is in progress'});return;}busy=true;
 try {
 const action=req.params.action;
 if(action==='run'){
  await mkdir('fixtures/tests',{recursive:true});await writeFile(allowedPath,original);suggestion=false;
  const result=await runTest('red');stage=result.exitCode!==0 && result.output.includes("getByTestId('save-user')") && result.output.includes('Timeout')?'red':'unexpected';res.json({...result,stage,assertion:"toHaveText('Saved successfully')"});
 }else if(action==='suggest'){
  if(stage!=='red')throw new Error('Run the broken test first');
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
  let payload;
  try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5210/fixture/v2');
   const candidate=page.getByRole('button',{name:'Save profile',exact:true});
   if(await page.getByTestId('save-profile').count()!==1 || await candidate.count()!==1 || !await candidate.isEnabled() || !await candidate.isVisible() || await candidate.getAttribute('data-testid')!=='save-profile')throw new Error('No unique actionable candidate');
   suggestion=true;payload={stage:'suggested',mode:'HEURISTIC / NO AI',reason:'The single visible, enabled Save profile button has data-testid="save-profile".',diff:`- page.${oldLocator}\n+ page.${newLocator}`,matches:1};
  }finally{await browser.close()}
  res.json(payload);
 }else if(action==='apply'){
  if(!suggestion||stage!=='red')throw new Error('Validate a suggestion first');
  const before=await readFile(allowedPath,'utf8');const after=validatePatch(allowedPath,before,before.replace(oldLocator,newLocator));await writeFile(allowedPath,after);
  const result=await runTest('green');stage=result.exitCode===0?'green':'failed';suggestion=false;
  const diff=createTwoFilesPatch(allowedPath,allowedPath,before,after);
  await writeFile('artifacts/green/repair.diff',diff);
  await writeFile('artifacts/green/source-after.ts',after);
  res.json({...result,stage,diff,assertionUnchanged:after.replace(newLocator,oldLocator)===original,source:after});
 }else{res.status(404).json({error:'Unknown action'})}
 }catch(e){res.status(400).json({error:(e as Error).message})}finally{busy=false}
});
app.listen(5210,'127.0.0.1',()=>console.log('Self-Healing Tests API :5210'));
