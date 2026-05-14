import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runEntire, repoPath } from "../cli.js";

const RepoDirSchema = z
  .string()
  .optional()
  .describe("Absolute path to the git repo. Falls back to ENTIRE_REPO_PATH env var.");

export function registerExplainTools(server: McpServer): void {
  server.registerTool(
    "entire_explain_commit",
    {
      title: "Explain Commit",
      description: `Retrieve the AI agent session transcript for a specific git commit SHA.
Uses \`entire explain --commit <SHA> --no-pager\`.

Useful for tracing WHY a piece of code was written — run \`git blame\` first to find the commit, then use this tool to read the original session context.`,
      inputSchema: z.object({
        commit: z.string().describe("Git commit SHA (full or short)"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ commit, repo_dir }) => {
      try {
        const { stdout } = await runEntire(
          ["explain", "--commit", commit, "--no-pager"],
          { cwd: repoPath(repo_dir), timeout: 60_000 }
        );
        return {
          content: [{ type: "text", text: stdout || "No transcript found for this commit." }],
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
    "entire_explain_checkpoint",
    {
      title: "Explain Checkpoint (with flags)",
      description: `Retrieve transcript for a specific checkpoint ID with optional depth flags.
Uses \`entire explain --checkpoint <ID> [--full|--raw-transcript] --no-pager\`.

Modes:
- default: summary view
- full: complete session transcript
- raw: raw JSONL transcript (for programmatic parsing)`,
      inputSchema: z.object({
        checkpoint_id: z.string().describe("Checkpoint ID"),
        mode: z
          .enum(["default", "full", "raw"])
          .optional()
          .default("default")
          .describe('"default" = summary, "full" = full transcript, "raw" = raw JSONL'),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ checkpoint_id, mode, repo_dir }) => {
      try {
        const args = ["explain", "--checkpoint", checkpoint_id];
        if (mode === "full") args.push("--full");
        else if (mode === "raw") args.push("--raw-transcript");
        args.push("--no-pager");

        const { stdout } = await runEntire(args, {
          cwd: repoPath(repo_dir),
          timeout: 60_000,
        });
        return {
          content: [{ type: "text", text: stdout || "No transcript found." }],
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
