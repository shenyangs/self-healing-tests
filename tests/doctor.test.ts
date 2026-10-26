import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
it('缺少依赖时输出中文恢复命令并失败退出',()=>{
 mkdirSync('artifacts',{recursive:true});
 const root=mkdtempSync(path.resolve('artifacts/doctor-empty-'));
 try{
  writeFileSync(path.join(root,'package.json'),JSON.stringify({dependencies:{'@playwright/test':'*'}}));
  const result=spawnSync(process.execPath,['scripts/doctor.mjs',`--root=${root}`],{encoding:'utf8',timeout:10000});
  writeFileSync('artifacts/zh-doctor-missing.log',result.stdout+result.stderr);
  expect(result.status).toBe(1);expect(result.stdout).toContain('缺少依赖');expect(result.stdout).toContain('npm ci');expect(result.stdout).not.toContain('ERR_MODULE_NOT_FOUND');
 }finally{rmSync(root,{recursive:true,force:true})}
});
