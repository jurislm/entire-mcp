import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runEntire, repoPath } from "../cli.js";

const RepoDirSchema = z
  .string()
  .optional()
  .describe("Absolute path to the git repo. Falls back to ENTIRE_REPO_PATH env var.");

export function registerSessionTools(server: McpServer): void {
  server.registerTool(
    "entire_session_list",
    {
      title: "List Sessions",
      description: `List all AI agent sessions tracked by Entire for this repo.
Uses \`entire session list\` — reliable local read.`,
      inputSchema: z.object({
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ repo_dir }) => {
      try {
        const { stdout } = await runEntire(["session", "list"], {
          cwd: repoPath(repo_dir),
        });
        return {
          content: [{ type: "text", text: stdout || "No sessions found." }],
        };
      } catch (error: unknown) {
        return {
          content: [{ type: "text", text: String(error) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "entire_session_current",
    {
      title: "Current Session",
      description: `Show the active session for the current worktree.
Uses \`entire session current --json\`.

Returns JSON with session_id, agent_type, transcript_path, and metadata.
Used by the session-to-skill workflow to read the current session's context.`,
      inputSchema: z.object({
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ repo_dir }) => {
      try {
        const { stdout } = await runEntire(["session", "current", "--json"], {
          cwd: repoPath(repo_dir),
        });
        return {
          content: [{ type: "text", text: stdout || "No active session in current worktree." }],
        };
      } catch (error: unknown) {
        return {
          content: [{ type: "text", text: String(error) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "entire_session_info",
    {
      title: "Get Session Info",
      description: `Show details for a specific session ID including transcript path, files touched, and token usage.
Uses \`entire session info <id>\`.`,
      inputSchema: z.object({
        session_id: z.string().describe("The session ID (format: YYYY-MM-DD-uuid)"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ session_id, repo_dir }) => {
      try {
        const { stdout } = await runEntire(["session", "info", session_id], {
          cwd: repoPath(repo_dir),
        });
        return {
          content: [{ type: "text", text: stdout || "No output." }],
        };
      } catch (error: unknown) {
        return {
          content: [{ type: "text", text: String(error) }],
          isError: true,
        };
      }
    }
  );
}
