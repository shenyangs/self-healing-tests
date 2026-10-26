import {supportedNode,nodeRequirement} from './runtime.mjs';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import net from 'node:net';
const ownRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(process.argv.find(x=>x.startsWith('--root='))?.slice(7)||ownRoot);
let failures=0;
const report=(ok,message)=>{console.log(`${ok?'✓':'✗'} ${message}`);if(!ok)failures++};
report(supportedNode(process.versions.node),`Node.js ${process.versions.node}（要求 ${nodeRequirement}）`);
let pkg;
try{pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'))}catch{report(false,'未找到有效 package.json，请在项目根目录运行。');process.exit(1)}
const deps=Object.keys({...pkg.dependencies,...pkg.devDependencies});
const missing=deps.filter(name=>!existsSync(path.join(root,'node_modules',name)));
report(!missing.length,missing.length?`缺少依赖：${missing.join('、')}。请运行 npm ci --cache .npm-cache 或 npm run setup。`:'项目依赖已安装');
if(!missing.length){
 try{
  const require=createRequire(path.join(root,'package.json'));
  require.resolve('@playwright/test');
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root,'.browsers');
  // Playwright reads the browser location when imported; set it before the child probe instead.
  const {spawnSync}=await import('node:child_process');
  const probe=spawnSync(process.execPath,[path.join(ownRoot,'scripts/probe-browser.mjs')],{cwd:root,env:{...process.env},encoding:'utf8',timeout:20000});
  report(probe.status===0,probe.status===0?'Chromium 启动和 FFmpeg 录屏检查通过':'浏览器或录屏组件不可用。运行 npm run setup；复用浏览器时同时配置 PLAYWRIGHT_EXECUTABLE_PATH。');
  if(probe.status!==0)console.log((probe.stderr||probe.error?.message||'检查超时').slice(-1500));
 }catch{report(false,'无法加载 Playwright，请运行 npm ci --cache .npm-cache。')}
}
for(const port of [4210,5210]){
 const free=await new Promise(resolve=>{const server=net.createServer();server.once('error',()=>resolve(false));server.listen(port,'127.0.0.1',()=>server.close(()=>resolve(true)))});
 report(free,`端口 ${port} ${free?'可用':'已占用；若本项目正在运行，请先 Ctrl+C 停止再检查。不要关闭未知进程。'}`);
}
console.log('本项目采用本地样例与启发式规则，不调用模型，不需要 API Key。');
console.log(failures?'请按提示修复后重新运行 npm run doctor。':'检查通过。npm run dev → http://127.0.0.1:4210');
process.exitCode=failures?1:0;
