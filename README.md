# @jurislm/entire-mcp

MCP server for the [Entire CLI](https://github.com/entireio/cli) — 19 tools for managing AI agent checkpoints and sessions.

## Requirements

- [Entire CLI](https://github.com/entireio/cli) installed and authenticated (`entire login`)
- Node.js ≥ 18 or Bun ≥ 1.1

## Installation

Add to your Claude Code `.mcp.json`:

```json
{
  "entire": {
    "command": "npx",
    "args": ["-y", "@jurislm/entire-mcp@latest"],
    "env": {
      "ENTIRE_REPO_PATH": "/path/to/your/repo"
    }
  }
}
```

> **Note:** `ENTIRE_REPO_PATH` must be set in `~/.zshenv` (not `~/.zshrc`) — MCP servers run as non-interactive subprocesses and do not source shell rc files.

## Tools (19)

### Checkpoint

| Tool | Description |
|------|-------------|
| `entire_checkpoint_list` | List all checkpoints on the current branch (local read) |
| `entire_checkpoint_explain` | View a checkpoint's full transcript and summary |
| `entire_checkpoint_rewind_list` | List available rewind points |
| `entire_checkpoint_rewind` | ⚠️ Rewind to a checkpoint commit (destructive) |

### Explain

| Tool | Description |
|------|-------------|
| `entire_explain_commit` | Get session transcript for a git commit SHA |
| `entire_explain_checkpoint` | Get checkpoint transcript — modes: `default` / `full` / `raw` |

### Search

| Tool | Description |
|------|-------------|
| `entire_search` | Search checkpoints with `--json` output; filters: `repo`, `branch`, `author`, `date`, `limit`, `page` |

### Session

| Tool | Description |
|------|-------------|
| `entire_session_list` | List all sessions (local read) |
| `entire_session_current` | Active session JSON for the current worktree |
| `entire_session_info` | Show details for a specific session ID |

### Misc

| Tool | Description |
|------|-------------|
| `entire_version` | Verify CLI is installed and show version |
| `entire_status` | Get active session ID for the current repo |
| `entire_recap` | Generate a summary of the current session's work |
| `entire_doctor` | Diagnose Entire installation and repo setup |
| `entire_resume` | Check out a branch and restore session metadata |
| `entire_attach` | Link an untracked session to Entire's checkpoint system |
| `entire_labs_review` | Experimental code review (preview, may be unstable) |
| `entire_dispatch` | Generate a dispatch summarizing recent agent work |
| `entire_activity` | Display activity overview and repository breakdown |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENTIRE_REPO_PATH` | Recommended | Default git repo path (fallback for each tool's `repo_dir` parameter) |

Each tool also accepts a `repo_dir` parameter to override this variable per call.

## Authentication

All tools rely on `entire login` having been run locally. Tokens are stored in the OS keychain. This MCP server does not manage authentication.

## Notes

- `entire checkpoint search --json` is an unstable preview feature and is intentionally excluded. Use `entire_checkpoint_list` + `entire_checkpoint_explain` instead.
- `entire_search` always passes `--json` — running `entire search` without it opens an interactive TUI, which hangs in non-interactive MCP subprocesses.

## License

MIT
