import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export function systemCaches(platform=process.platform,env=process.env,home=os.homedir()){
 if(platform==='darwin')return [path.join(home,'Library/Caches/ms-playwright')];
 if(platform==='win32')return [path.join(env.LOCALAPPDATA||path.join(home,'AppData/Local'),'ms-playwright')];
 return [path.join(env.XDG_CACHE_HOME||path.join(home,'.cache'),'ms-playwright')];
}
const executableNames=[
 'chrome-headless-shell-mac-arm64/chrome-headless-shell','chrome-headless-shell-mac-x64/chrome-headless-shell',
 'chrome-headless-shell-linux64/chrome-headless-shell','chrome-headless-shell-win64/chrome-headless-shell.exe',
 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
 'chrome-mac/Chromium.app/Contents/MacOS/Chromium','chrome-linux/chrome','chrome-linux64/chrome',
 'chrome-win/chrome.exe','chrome-win64/chrome.exe','chrome-linux/headless_shell','chrome-win/headless_shell.exe'];
const file=p=>{try{return statSync(p).isFile()}catch{return false}};
function findBrowser(cache,revision){
 if(!existsSync(cache))return;
 const dirs=readdirSync(cache).filter(x=>/^(chromium|chromium_headless_shell)-\d+$/.test(x));
 dirs.sort((a,b)=>Number(b.endsWith('-'+revision))-Number(a.endsWith('-'+revision))||Number(b.split('-').pop())-Number(a.split('-').pop()));
 for(const dir of dirs.slice(0,20))for(const name of executableNames){const executable=path.join(cache,dir,name);if(file(executable))return executable}
}
/** Only reads project and standard Playwright cache locations. Launch validation is performed by doctor/tests. */
export function resolveBrowser({root=process.cwd(),env=process.env,cacheRoots=systemCaches(),platform=process.platform}={}){
 const manifest=JSON.parse(readFileSync(path.join(root,'node_modules/playwright-core/browsers.json'),'utf8'));
 const revision=manifest.browsers.find(x=>x.name==='chromium').revision;
 const ffmpeg=manifest.browsers.find(x=>x.name==='ffmpeg').revision;
 const project=path.join(root,'.browsers');
 const explicit=env.PLAYWRIGHT_BROWSERS_PATH;
 const explicitCache=explicit==='0'?path.join(root,'node_modules/playwright-core/.local-browsers'):explicit?path.resolve(root,explicit):undefined;
 const caches=[...new Set([explicitCache,project,...cacheRoots].filter(Boolean))];
 let executablePath=env.PLAYWRIGHT_EXECUTABLE_PATH;
 let source='显式环境变量';
 if(executablePath){executablePath=path.resolve(root,executablePath);if(!file(executablePath))throw Error('显式指定的 Chromium 文件不存在，请修正 PLAYWRIGHT_EXECUTABLE_PATH。')}
 else for(const cache of caches){executablePath=findBrowser(cache,revision);if(executablePath){source=cache===explicitCache?'显式缓存':cache===project?'项目浏览器':'已有系统 Playwright 缓存（只读）';break}}
 if(!executablePath)throw Error('未找到 Chromium。请运行 npm run setup 安装项目浏览器。');
 const ffmpegName=platform==='win32'?'ffmpeg-win64.exe':platform==='darwin'?'ffmpeg-mac':'ffmpeg-linux';
 const browserCache=explicitCache||caches.find(cache=>file(path.join(cache,`ffmpeg-${ffmpeg}`,ffmpegName)));
 if(!browserCache||!file(path.join(browserCache,`ffmpeg-${ffmpeg}`,ffmpegName)))throw Error('缺少当前 Playwright 所需 FFmpeg 录屏组件。请运行 npm run setup；若指定缓存，请检查 PLAYWRIGHT_BROWSERS_PATH。');
 return {executablePath,browserCache,source};
}
export function configureBrowser(options){const result=resolveBrowser(options);process.env.PLAYWRIGHT_EXECUTABLE_PATH=result.executablePath;process.env.PLAYWRIGHT_BROWSERS_PATH=result.browserCache;return result}
