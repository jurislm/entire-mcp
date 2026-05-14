# CLAUDE.md — JurisLM Entire MCP Server

Entire CLI 的 MCP wrapper，提供 11 個工具用於管理 AI agent checkpoints 和 sessions。

## 常用命令

```bash
bun install          # 安裝依賴
bun run build        # 編譯 TypeScript 到 dist/
bun run dev          # 開發模式（bun --watch，stdio transport）
bun run lint         # ESLint 檢查（max-warnings=0）
bun run typecheck    # TypeScript 型別檢查
bun run test         # Vitest 單元測試

# 本地執行（需要先 entire login）
ENTIRE_REPO_PATH="/path/to/your/repo" bun dist/index.js
```

## Git 分支規範

```
develop → PR → main
```

- 日常開發一律在 `.worktrees/develop` 目錄，不在 main worktree 做 feature commits
- **嚴禁直接 push 到 main**
- 版本號由 Release Please 自動管理，**禁止手動修改 `package.json` 版本號**

## 架構

```
src/
├── index.ts           # MCP server 入口，載入所有 tools
├── cli.ts             # entire CLI 執行 helper（execFile wrapper）
└── tools/
    ├── checkpoint.ts  # 4 個 checkpoint 工具
    ├── session.ts     # 2 個 session 工具
    └── misc.ts        # 5 個其他工具（recap、doctor、resume、attach、labs review）
```

## 工具清單（11 個）

### Checkpoint（4 tools）
- `entire_checkpoint_list` — 列出所有 checkpoints（可靠，本地讀取）
- `entire_checkpoint_explain` — 查看特定 checkpoint 完整 transcript + 摘要
- `entire_checkpoint_rewind_list` — 列出可用 rewind points
- `entire_checkpoint_rewind` — ⚠️ 回退到指定 checkpoint commit（destructive）

### Session（2 tools）
- `entire_session_list` — 列出所有 sessions（可靠，本地讀取）
- `entire_session_info` — 查看特定 session 詳情

### Misc（5 tools）
- `entire_recap` — 生成當前 session 工作摘要
- `entire_doctor` — 診斷 Entire 安裝和 repo 設定
- `entire_resume` — 切換到 branch 並恢復 session metadata
- `entire_attach` — 將未追蹤的 session 加入 Entire checkpoint 系統
- `entire_labs_review` — 實驗性 code review（preview，可能不穩定）

## 環境變數

| 變數 | 必需 | 說明 |
|------|------|------|
| `ENTIRE_REPO_PATH` | 建議 | 預設 git repo 路徑（工具 `repo_dir` 參數的 fallback） |

每個工具也接受 `repo_dir` 參數覆蓋此環境變數。

**注意**：MCP Server 是非互動式子進程，環境變數必須寫入 `~/.zshenv`（非 `~/.zshrc`）。

## 認證

所有工具都依賴本機已執行的 `entire login`，token 儲存於 OS keychain。MCP server 本身不管理認證。

## 模式 87 注意事項

`entire checkpoint search --json` 是 preview 功能，**不可靠**，已刻意排除在此 MCP server 之外。
改用 `entire_checkpoint_list` + `entire_checkpoint_explain` 組合查詢。

## 新增工具流程

1. `src/tools/<category>.ts` — 新增 MCP tool（`server.registerTool()`）
2. `src/index.ts` — import 並呼叫 `register*Tools(server)`

工具命名規則：`entire_` 前綴 + `snake_case`

## 版本發布

1. PR `develop` → `main` merge
2. Release Please 自動建立版本 PR
3. 合併版本 PR 後，**手動執行** `bun publish --access public`
