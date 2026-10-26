import path from 'node:path';
import {mkdir,rm} from 'node:fs/promises';
const {configureBrowser}=await import('./browser.mjs');
const browserConfig=configureBrowser();
console.log('浏览器来源：'+browserConfig.source);
const {chromium}=await import('@playwright/test');
const dir=path.resolve('.doctor-video');
let browser;
try{
 await mkdir(dir,{recursive:true});
 browser=await chromium.launch({executablePath:browserConfig.executablePath,timeout:10000});
 const context=await browser.newContext({recordVideo:{dir}});
 const page=await context.newPage();await page.setContent('<p>浏览器诊断</p>');
 await context.close();
}finally{await browser?.close();await rm(dir,{recursive:true,force:true})}
