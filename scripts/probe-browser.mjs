import path from 'node:path';
import {mkdir,rm} from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir=path.resolve('.doctor-video');
let browser;
try{
 await mkdir(dir,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,timeout:10000});
 const context=await browser.newContext({recordVideo:{dir}});
 const page=await context.newPage();await page.setContent('<p>浏览器诊断</p>');
 await context.close();
}finally{await browser?.close();await rm(dir,{recursive:true,force:true})}
