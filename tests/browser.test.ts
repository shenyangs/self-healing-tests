import {it,expect} from 'vitest';
import {mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {resolveBrowser,systemCaches} from '../scripts/browser.mjs';
it('浏览器优先级、显式配置错误和录屏组件要求',()=>{
 mkdirSync('artifacts',{recursive:true});const root=mkdtempSync(path.resolve('artifacts/browser-test-'));
 const make=(name:string,data='')=>{const p=path.join(root,name);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,data);return p};
 try{
 make('node_modules/playwright-core/browsers.json',JSON.stringify({browsers:[{name:'chromium',revision:'1248'},{name:'ffmpeg',revision:'1013'}]}));
 make('.browsers/ffmpeg-1013/ffmpeg-mac');
 const cached=make('cache/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell');
 const options={root,env:{},cacheRoots:[path.join(root,'cache')],platform:'darwin'};
 expect(resolveBrowser(options).executablePath).toBe(cached);
 const local=make('.browsers/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell');
 expect(resolveBrowser(options).executablePath).toBe(local);
 expect(resolveBrowser({...options,env:{PLAYWRIGHT_EXECUTABLE_PATH:cached}}).executablePath).toBe(cached);
 expect(()=>resolveBrowser({...options,env:{PLAYWRIGHT_EXECUTABLE_PATH:'missing'}})).toThrow('显式');
 rmSync(path.join(root,'.browsers/ffmpeg-1013'),{recursive:true});expect(()=>resolveBrowser(options)).toThrow('FFmpeg');
 }finally{rmSync(root,{recursive:true,force:true})}
});
it('跨平台缓存目录不含用户私有硬编码路径',()=>{
 expect(systemCaches('darwin',{},'/example')[0]).toBe(path.join('/example','Library/Caches/ms-playwright'));
 expect(systemCaches('linux',{XDG_CACHE_HOME:'/cache'},'/example')[0]).toBe(path.join('/cache','ms-playwright'));
 expect(systemCaches('win32',{LOCALAPPDATA:'/local'},'/example')[0]).toBe(path.join('/local','ms-playwright'));
});
