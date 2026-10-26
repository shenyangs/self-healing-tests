# 测试自修复实验室 · Self-Healing Tests

**按钮改名了，测试失败了。只改一个定位器，同一断言再次通过。**

这是可运行的定位器修复概念验证：React 界面触发真实 Chromium / Playwright 测试，检查真实页面，修改一个指定测试文件，再用完全相同的断言复验。默认中文、深色界面，支持窄屏与键盘操作。

## 环境与安装

需要 Node.js **22.12+（22.x）、24.x 或 26+**、随 Node 安装的 npm，以及能够运行 Chromium 的桌面系统。该范围与锁定的 Vite/Vitest 要求一致，推荐 Node.js 24 LTS。开发验收环境是 macOS Apple Silicon；Windows/Linux 的全新安装尚未实测。全新安装需要网络下载 npm 包和浏览器。无需 Python、云服务或 API Key。

在本项目根目录运行（macOS/Linux 终端、Windows PowerShell 命令相同）：

```sh
npm run setup
npm run doctor
npm run dev
```

`setup` 是不依赖 node_modules 的 Node 脚本，顺序执行 `npm ci --cache .npm-cache` 和 Playwright Chromium 安装。依赖锁定于 `package-lock.json`；依赖、下载缓存和浏览器分别存于 `node_modules/`、`.npm-cache/`、`.browsers/`，不会安装系统软件或修改全局配置。已有完整浏览器时 Playwright 会复用。完整的手动等价安装为：

```sh
npm ci --cache .npm-cache
```

随后在 macOS/Linux 设置本次命令的浏览器目录：

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" npx playwright install chromium
```

Windows PowerShell 对应写法（不要使用上述 shell 赋值语法）：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.browsers'
npx playwright install chromium
```

Linux 若缺少浏览器系统库，`doctor` 会报告浏览器不可用；本项目不会自动安装操作系统依赖，请按 Playwright 报错由系统管理员处理。

启动后打开 **http://127.0.0.1:4210**（localhost 的 IPv4 回环入口）。API 健康检查：**http://127.0.0.1:5210/api/health**。服务只绑定 `127.0.0.1`，不向局域网开放。终端也会打印中文访问入口。

## 三步演示（零密钥）

1. **运行失败测试**：恢复原测试，在 V2 页面寻找旧的 `save-user`，真实超时失败，显示退出码 1。
2. **获取修复建议**：读取页面，检查唯一、可见、启用的“保存资料”按钮及其 `save-profile` 标识。
3. **应用并重新验证**：只替换一个定位器，重新运行 Playwright；真实退出码为 0 且原始 `保存成功` 断言保留，才显示验证通过。

再次点击第一步即可重置。操作期间按钮禁用并显示中文进度；Tab 可依次访问按钮、日志区与证据链接，Enter 激活按钮。

界面明确标注 **本地样例 · 启发式规则 / 无 AI 推理**。样例页面是人工构造的，本地测试、页面读取、源文件修改与录屏都是真实执行，不是回放。没有接入模型，不读取 `.env` 中的密钥。`.env.example` 仅说明可选环境变量，**不会自动加载**。

## 主要依赖的作用

| 依赖 | 用途 |
| --- | --- |
| React / React DOM | 中文交互界面与状态更新 |
| Vite / React 插件 | 本地开发服务器、API 代理与网页构建 |
| TypeScript / tsx | 类型检查和 TypeScript API 执行 |
| Express | 本地 API、样例页面及证据下载 |
| @playwright/test | Chromium 自动化、断言、截图、视频和追踪 |
| diff | 从实际修改前后源码生成统一差异文件 |
| Vitest | 防止修改断言、跳过测试、越界路径等单元校验 |
| concurrently | 同时启动网页与 API，退出时一并停止 |
| @types/* | 开发时的类型定义 |
| lucide-react / zod | 脚手架保留依赖；当前闭环未使用 |

## 诊断与失败恢复

`npm run doctor` 检查 Node 版本、项目依赖、真实 Chromium 启动与 FFmpeg 录屏、4210/5210 端口。缺依赖时输出中文安装命令并退出 1，不会要求无关密钥。请在启动服务**之前**运行；服务运行期间端口被占用属于预期情况。

- 安装中断：检查网络，重新 `npm run setup`。不要删除系统浏览器或其他项目文件。
- 缺依赖：`npm ci --cache .npm-cache`；缺浏览器或录屏组件：`npm run setup`。
- 端口占用：先在运行本项目的终端 Ctrl+C，再运行 doctor。若其他程序占用，请手动确认所属程序，不要盲目杀进程；本项目端口固定。
- API 不可达或流程失败：确认 `npm run dev` 正在运行，查看界面中文提示和原始日志，再点击第一步。不要改断言来消除失败。
- 后端重启：内存状态丢失，从第一步重新开始。

可只读复用已有兼容 Chromium，避免重复下载：设置 `PLAYWRIGHT_EXECUTABLE_PATH` 为浏览器可执行文件的实际路径，仍需 `.browsers` 中具备本 Playwright 版本所需 FFmpeg；也可设置 `PLAYWRIGHT_BROWSERS_PATH` 指向兼容缓存。macOS/Linux 使用 `export VARIABLE="路径"`；PowerShell 使用 `$env:VARIABLE = '路径'`。不要照抄别人的私有绝对路径。`setup` 始终将新安装写入项目 `.browsers`。

## 真实验证与证据

先停止开发服务，再运行：

```sh
npm run build
npm run test
npm run e2e
npm run demo
```

本次中文验收：build 通过、单元测试 7/7、E2E 4/4、独立 demo 1/1；doctor 正常环境检查通过，缺依赖路径返回预期的中文错误和退出码 1。实际 npm ci 已成功，setup 脚本通过语法检查，但未重复执行完整浏览器下载；全新安装仍属未验证。

E2E/demo 自行启动服务器，单 worker 执行。包括 V1/V2 保存行为、红→绿闭环、源码精确相等、非法操作顺序、重置、中文窄屏与键盘入口验证。断言始终是 `toHaveText('保存成功')`，运行时修复只允许 locator 改名。

- `artifacts/zh-build.log`、`zh-test.log`、`zh-e2e.log`、`zh-demo.log`：中文版本验收的真实命令输出。
- `artifacts/zh-doctor.log`：实际浏览器与环境诊断。
- `artifacts/red/` / `green/`：退出码、原始输出、执行源码、浏览器截图/视频/trace。
- `artifacts/green/repair.diff`：真实源码差异。
- `artifacts/playwright/`：最近一次演示的真实录屏；每次 e2e/demo 会覆盖此目录。
- `artifacts/verified.png`：中文演示截图；`artifacts/zh-mobile.png`：窄屏截图。
- `status.json`：最终实际检查结果和未验证项。

工具原始日志、代码标识与 diff 保留原文，避免篡改证据。预期红灯的退出码 1 是演示成功所需的中间结果。历史失败证据保留在 artifacts 中，未提交 Git。中文版本首次 E2E 发现重置后读取旧日志导致后续请求遇到忙碌状态，已清空旧结果并显式等待新请求完成；失败日志为 `artifacts/zh-e2e-attempt-1.log`。首次验收曾缺 FFmpeg，后安装解决；后续曾发现建议响应早于浏览器清理的竞态，现已修正。

## 能力边界

仅支持已知本地样例中的一个定位器改名，**不是通用自动修复工具**。不调用大模型、不执行生成代码、不读取任意用户文件、不访问外站。保存行为仅更新页面 DOM，没有资料数据库。拒绝改变断言、测试跳过、任意选择器或文件路径。运行器有 25 秒进程上限和测试超时。

单个内存工作流，不支持多人并发；证据会随重跑覆盖，重要证据请自行复制。服务无认证，仅供本机开发演示，不适合公开部署。全新环境完整安装、Windows/Linux 实际运行未验证；本机验收复用已有 Chromium，并使用项目内 FFmpeg。MIT 许可原文见 LICENSE。
