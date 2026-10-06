# 更新日志

## 0.9.7 — 2026-10-06

本版本汇总此前已合并的全部维护变更；版本号升级本身不增加独立产品功能。需要 **Node.js >=22.19.0**。包名仍为 `@joyccn/zenrouter`，命令仍为 `zenrouter`。

### 目录与客户端身份

新增 **120 个提供商/模型条目**（100 个聊天、8 个图像、6 个嵌入、6 个 TTS）及 **342 条有来源的元数据记录**；**827 个历史条目仍未逐项验证**。区分 API、IDE/OAuth 和编程套餐的限制、价格及未知值。修复提供商/定价别名、模型传输选择、免认证发现、跨服务类型重复 ID、实时/自定义能力、输入/上下文/输出限制及长上下文/自定义定价。非 token 计费不伪装成 token 单价，未知价格不代表免费。更新已研究的客户端身份和 Gemini/Copilot 端点专用请求头，不赋予额外 beta 权限。

### 推理与用量

显式及可空输出上限和提供商原生思考模式保留到最终序列化，不暗中提高付费上限。保留 Responses 推理字段，并依据 Claude 实际出站交错支持处理预算，包括 beta 被拒后的重试。记录预算耗尽尝试的真实用量，Gemini 思考 token 只合并一次；保留未完成终态、部分输出和拒绝，避免终态后取消的重复持久化及组合流被误判为空而重放。不新增自动扩大预算的重试。Codex OAuth、OpenCode Muse 和 Cursor 仍不执行公开 API 的上限；token 上限不是总金额预算。

### 有依据的网络搜索

裸提供商名称与 `provider/search` 选择服务默认值，而非上游模型名。派发前验证显式选择及组合成员所属关系。Antigravity 使用独立 sandbox、真实项目/request/session ID、模型/思考映射、Google Search 和每账户严格代理策略。从答案和引用上下文中排除 `thought: true`。特定 Gemini 模型 404 只尝试一个账户；准确匹配但含义不明的 Antigravity 资源 404 最多尝试 **三个**，不为健康账户写入冷却。成功只清除对应搜索范围，其他认证/配额回退不变。

### 依赖、安装器与界面

升级 React **19.3.0**、ESLint **10.12.0**、Vitest **5.0.3**/Vite **8.3.2**、Undici **8.11.2**。保留 Node 22 dispatcher、CONNECT、DNS 固定、取消和严格代理失败时禁止直连的策略，移除未使用依赖。安装器验证准确的最低运行时和新链接的 CLI。打包 Monaco **0.57.0** 及同源 worker，修复文档 markdown/语言切换和 React 警告，同时保留草稿与 hydration 安全。有限 ESM 边界不改变 CommonJS 启动器；保留可选 SQLite 回退。

### 发布保护

手动 npm/Docker 流程要求真实稳定标签及精确源提交；npm provenance 也必须匹配 dispatch ref/SHA。发布前保存原始 tarball，重试时根据 registry SHA512 校验恢复。全局串行化和数字版本比较阻止旧版本重试覆盖更新的 `latest`；缺少原始恢复 artifact 时安全停止。

### 验证、安全与升级限制

既有验证覆盖隔离测试、零警告 lint、应用/CLI 构建、文档导出、浏览器检查及真实 loopback/standalone SQLite 搜索与用量验收。最终本地发布验证：Node 22.23.2 上 **494 个测试文件，4,091 项通过，100 项跳过，1 项 todo，零失败**；零错误/警告 lint、CLI 打包与 Docker 冒烟测试均通过。未使用生产账户、真实上游推理、新增付费重试或自动部署。目录研究 **不证明账户权限或上游实际可用性**。

TLS 验证保持开启；自签名例外仅限具体测试请求，不是全局设置。**node-forge 和 braces 的安全公告仍未解决**，不宣称本版本没有漏洞。发布后可安装 `@joyccn/zenrouter@0.9.7` 或使用固定镜像 `joyccn/zenrouter:0.9.7`。容器发布流程仅面向 **linux/amd64**；持久化 **/app/data** 并在升级前备份。文档不证明发布已完成或标签已可用。

---

[GitHub 发布](https://github.com/ZenRouter/ZenRouter/releases/tag/v0.9.7) · [完整变更日志](https://github.com/ZenRouter/ZenRouter/blob/master/CHANGELOG.md) · [技术详情](https://github.com/ZenRouter/ZenRouter/blob/master/docs/CHANGELOG_v0.9.7.md) · [发布说明](https://github.com/ZenRouter/ZenRouter/blob/master/releases/RELEASE_NOTES_v0.9.7.md) · [上一版本 0.9.6（历史记录）](https://github.com/ZenRouter/ZenRouter/blob/master/releases/RELEASE_NOTES_v0.9.6.md)
