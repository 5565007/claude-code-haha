# RoseCC 使用文档

本文档说明当前仓库里的 `rosecc` 如何使用，以及 `MCP / Skill / Plugin` 现在该怎么配置。

## 1. 当前状态

当前已经完成以下接入：

- 中转地址：`http://115.159.90.194:8080`
- 默认模型：`gpt-5.4`
- 启动命令：`rosecc`
- 稳定入口：`src/entrypoints/rosecc.ts`
- 会话模式：完整主程序
- Windows 运行时：`rosecc` 支持优先使用本地覆盖 Bun `1.3.11`

这次修复的关键点不是模型本身，而是完整主程序启动后会被 `C:\Users\Administrator\.claude\settings.json` 里的旧 `ANTHROPIC_BASE_URL` 覆盖，导致实际请求打到了别的旧中转地址。现在已经做了两层修复：

- 当前项目的 `.env` 增加了 `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1`
- `rosecc` 启动脚本会锁定 relay 路由，防止再被全局设置改掉

所以现在 `rosecc` 默认就是完整模式，不再走之前那个临时兼容 CLI。

补充说明：

- Windows 下直接运行旧入口 `bun --env-file=.env ./src/entrypoints/cli.tsx` 可能触发 Bun 1.3.7 的崩溃
- 现在已经新增稳定入口 `src/entrypoints/rosecc.ts`
- 如果本地存在 `.\.runtime\bun\windows-x64-1.3.11\bin\bun.exe`，`rosecc` 会优先使用它
- 日常使用请直接运行 `rosecc`，不要再手动用系统里的旧 `bun 1.3.7`

## 2. 直接怎么用

进入项目目录后：

```bash
rosecc
```

如果你想确认当前 `rosecc` 用的是哪个 Bun，可在另一个终端里查看进程命令行；如果启用了本地覆盖，通常会是：

```text
E:\RoseWeb\claude-code-haha\.runtime\bun\windows-x64-1.3.11\bin\bun.exe
```

单次问答：

```bash
rosecc -p "只回复ok"
```

查看帮助：

```bash
rosecc --help
```

查看 MCP 帮助：

```bash
rosecc mcp --help
```

查看插件帮助：

```bash
rosecc plugin --help
```

## 3. 关键配置位置

### 3.1 当前项目 relay 配置

文件：

- `.env`
- `bin/rosecc.js`
- `bin/rosecc`

当前核心配置：

```env
ANTHROPIC_AUTH_TOKEN=你的 relay key
ANTHROPIC_BASE_URL=http://115.159.90.194:8080
ANTHROPIC_MODEL=gpt-5.4
ANTHROPIC_DEFAULT_SONNET_MODEL=gpt-5.4
ANTHROPIC_DEFAULT_HAIKU_MODEL=gpt-5.4
ANTHROPIC_DEFAULT_OPUS_MODEL=gpt-5.4
CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1
```

`CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1` 很重要，它的作用是：

- 当前启动器提供的 relay、key、模型优先生效
- `~/.claude/settings.json` 不再覆盖这些 provider 路由参数

### 3.2 全局 Claude/CC 配置

文件：

- `C:\Users\Administrator\.claude\settings.json`

这里通常放：

- 全局插件开关
- 全局权限
- 全局 UI 设置
- 全局环境变量

这次我也已经把这个文件里的旧中转地址改成了你现在的 relay，并把模型改成了 `gpt-5.4`。

## 3.4 Windows 运行时说明

你之前报错的根因不是 `/mcp`、`/plugin`、`/agents` 没做，而是 Windows 下老的 Bun `1.3.7` 在交互 TTY 初始化时先崩了，导致完整会话根本起不来。

现在的处理方式是：

- `rosecc` 启动器在 Windows 上支持优先使用本地覆盖 Bun `1.3.11`
- 如果没有本地覆盖，则回退到系统 PATH 里的 `bun.exe`
- 所以平时请直接用 `rosecc`
- 如果你强行手动跑 `bun --env-file=.env ...`，仍然可能跑到系统旧版 Bun

### 3.3 项目配置

项目可选配置文件：

- `.claude/settings.json`
- `.claude/settings.local.json`
- `.mcp.json`
- `.claude/skills/<skill-name>/SKILL.md`

建议：

- 团队共享配置放 `.claude/settings.json`
- 个人本地覆盖放 `.claude/settings.local.json`

## 4. MCP 怎么设置

### 4.1 命令行方式

添加 HTTP MCP：

```bash
rosecc mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

添加带 Header 的 HTTP MCP：

```bash
rosecc mcp add --transport http my-api https://example.com/mcp --header "Authorization: Bearer xxx"
```

添加 stdio MCP：

```bash
rosecc mcp add my-server -- npx -y my-mcp-server
```

查看列表：

```bash
rosecc mcp list
```

查看详情：

```bash
rosecc mcp get sentry
```

删除：

```bash
rosecc mcp remove sentry
```

### 4.2 项目里手动写 `.mcp.json`

stdio 示例：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"]
    }
  }
}
```

HTTP 示例：

```json
{
  "mcpServers": {
    "my-http-server": {
      "type": "http",
      "url": "https://example.com/mcp"
    }
  }
}
```

生效范围：

- `~/.claude/settings.json` 里配置的是全局
- `.mcp.json` 是当前项目

现在完整主程序已经恢复，MCP 会在正常会话里加载，不会再像之前那样“配置存在但会话里看不到”。

## 5. Skill 怎么设置

### 5.1 放在哪里

全局目录：

- `C:\Users\Administrator\.claude\skills\<skill-name>\SKILL.md`

项目目录：

- `.claude/skills/<skill-name>/SKILL.md`

### 5.2 最小示例

目录结构：

```text
.claude/
  skills/
    review/
      SKILL.md
```

示例内容：

```md
---
description: Review current code changes and summarize risks
---

请检查当前改动，重点输出：

1. 明显 bug
2. 回归风险
3. 缺失测试
4. 简洁结论
```

使用方式：

- 在会话里直接提到技能名
- 或在支持 slash 的界面里通过技能入口触发

### 5.3 为什么你之前看不到

之前看不到，不是因为 Skill 系统不存在，而是 `rosecc` 默认被迫走了临时兼容 CLI。那个模式不是真正的完整主程序，所以会话里不会正常体现完整能力。

现在这个问题已经修掉了。

## 6. Plugin 怎么设置

### 6.1 查看和管理

查看帮助：

```bash
rosecc plugin --help
```

列出插件：

```bash
rosecc plugin list
```

安装插件：

```bash
rosecc plugin install <plugin>@<marketplace>
```

启用插件：

```bash
rosecc plugin enable <plugin>@<marketplace>
```

禁用插件：

```bash
rosecc plugin disable <plugin>@<marketplace>
```

卸载插件：

```bash
rosecc plugin uninstall <plugin>@<marketplace>
```

### 6.2 插件配置写哪里

通常写在：

- `C:\Users\Administrator\.claude\settings.json`
- `.claude/settings.json`
- `.claude/settings.local.json`

示例：

```json
{
  "enabledPlugins": {
    "playwright@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true
  }
}
```

### 6.3 当前你这台机器上已经启用的插件

当前全局配置里已经启用了这些插件：

- `oh-my-claudecode@omc`
- `playwright@claude-plugins-official`
- `rust-analyzer-lsp@claude-plugins-official`
- `typescript-lsp@claude-plugins-official`
- `ui-ux-pro-max@ui-ux-pro-max-skill`

## 7. 为什么现在能看到了

一句话：

之前不是 `MCP / Skill / Plugin` 没配置，而是完整主程序没有真正用到你想要的 relay。

现在修复后，主程序会：

- 启动完整 CLI
- 使用 `http://115.159.90.194:8080`
- 默认模型固定为 `gpt-5.4`
- 不再被旧全局中转覆盖

所以这些能力现在会跟着完整会话一起出现。

## 8. 推荐配置方式

推荐你以后按这个思路管理：

- relay、key、默认模型：放当前项目 `.env`
- 全局插件和全局权限：放 `C:\Users\Administrator\.claude\settings.json`
- 项目级 Skill：放 `.claude/skills/...`
- 项目级 MCP：放 `.mcp.json`
- 个人私有项目覆盖：放 `.claude/settings.local.json`

## 9. 常用排查

如果后面又遇到“明明配置了，但实际没生效”，优先检查这几项：

1. 当前启动的是否是 `rosecc`
2. 当前目录下 `.env` 是否还是你的 relay 配置
3. 是否有人把 `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1` 去掉了
4. `C:\Users\Administrator\.claude\settings.json` 是否又被别的工具改回旧中转

## 10. 当前结论

当前这套已经不是“只能聊天的兼容方案”了，而是完整主程序方案：

- `rosecc` 可直接进入完整主程序
- relay 已固定到 `http://115.159.90.194:8080`
- 默认模型是 `gpt-5.4`
- MCP / Skill / Plugin 现在有正常的主程序承载

如果你下一步要，我可以继续给你补一份：

- `.mcp.json` 实战模板
- `.claude/settings.json` 实战模板
- 一个你项目里可直接用的 `Skill` 示例目录
