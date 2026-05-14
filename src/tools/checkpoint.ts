import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runEntire, repoPath } from "../cli.js";

const RepoDirSchema = z
  .string()
  .optional()
  .describe("Absolute path to the git repo. Falls back to ENTIRE_REPO_PATH env var.");

export function registerCheckpointTools(server: McpServer): void {
  server.registerTool(
    "entire_checkpoint_list",
    {
      title: "List Checkpoints",
      description: `List all Entire checkpoints for the current repo in reverse chronological order.
Uses \`entire checkpoint list\` — reliable local read from the entire/checkpoints/v1 branch.`,
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
        const { stdout } = await runEntire(["checkpoint", "list"], {
          cwd: repoPath(repo_dir),
        });
        return {
          content: [{ type: "text", text: stdout || "No checkpoints found." }],
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
    "entire_checkpoint_explain",
    {
      title: "Explain Checkpoint",
      description: `Show the full transcript and session summary for a specific checkpoint ID.
Uses \`entire checkpoint explain <id>\` — reliable local read.`,
      inputSchema: z.object({
        checkpoint_id: z.string().describe("The checkpoint ID to explain"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ checkpoint_id, repo_dir }) => {
      try {
        const { stdout } = await runEntire(
          ["checkpoint", "explain", checkpoint_id],
          { cwd: repoPath(repo_dir) }
        );
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

  server.registerTool(
    "entire_checkpoint_rewind_list",
    {
      title: "List Rewind Points",
      description: `List all available checkpoint rewind points for the current branch.
Uses \`entire checkpoint rewind --list\`.`,
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
        const { stdout } = await runEntire(["checkpoint", "rewind", "--list"], {
          cwd: repoPath(repo_dir),
        });
        return {
          content: [{ type: "text", text: stdout || "No rewind points found." }],
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
    "entire_checkpoint_rewind",
    {
      title: "Rewind to Checkpoint",
      description: `Rewind the current branch to a specific checkpoint commit.

⚠️ Destructive: rewrites git history on the current branch. Use \`entire_checkpoint_rewind_list\` first to find the commit hash.`,
      inputSchema: z.object({
        commit: z.string().describe("Commit hash to rewind to"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ commit, repo_dir }) => {
      try {
        const { stdout } = await runEntire(
          ["checkpoint", "rewind", "--to", commit],
          { cwd: repoPath(repo_dir) }
        );
        return {
          content: [{ type: "text", text: stdout || "Rewind complete." }],
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
