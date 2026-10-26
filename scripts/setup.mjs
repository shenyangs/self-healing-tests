import {supportedNode,nodeRequirement} from './runtime.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!supportedNode(process.versions.node)){console.error(`需要 Node.js ${nodeRequirement}。`);process.exit(1)}
console.log('安装锁定的项目依赖和 Chromium；缓存与浏览器仅写入项目目录。无需 API Key。');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const env={...process.env,PLAYWRIGHT_BROWSERS_PATH:path.join(root,'.browsers')};
function run(command,args){const result=spawnSync(command,args,{cwd:root,env,stdio:'inherit',shell:command===npm&&process.platform==='win32'});if(result.error||result.status!==0){console.error('安装未完成，请检查网络和上方错误，恢复后重新运行 npm run setup。');process.exit(result.status||1)}}
run(npm,['ci','--cache','.npm-cache']);
run(process.execPath,['node_modules/@playwright/test/cli.js','install','chromium']);
console.log('安装完成。运行 npm run doctor 检查，然后 npm run dev。访问 http://127.0.0.1:4210');
