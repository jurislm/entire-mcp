import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runEntire, repoPath } from "../cli.js";

const RepoDirSchema = z
  .string()
  .optional()
  .describe("Absolute path to the git repo. Falls back to ENTIRE_REPO_PATH env var.");

export function registerMiscTools(server: McpServer): void {
  server.registerTool(
    "entire_recap",
    {
      title: "Session Recap",
      description: `Generate a summary of the current session's work.
Uses \`entire recap\`.`,
      inputSchema: z.object({
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ repo_dir }) => {
      try {
        const { stdout } = await runEntire(["recap"], {
          cwd: repoPath(repo_dir),
          timeout: 60_000,
        });
        return {
          content: [{ type: "text", text: stdout || "No recap generated." }],
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
    "entire_doctor",
    {
      title: "Doctor",
      description: `Run diagnostics on the Entire installation and current repo setup.
Uses \`entire doctor\`.`,
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
        const { stdout } = await runEntire(["doctor"], {
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

  server.registerTool(
    "entire_resume",
    {
      title: "Resume Branch Session",
      description: `Check out a branch, restore session metadata, and get the command to continue an AI agent session.
Uses \`entire resume <branch>\`.`,
      inputSchema: z.object({
        branch: z.string().describe("Branch name to resume (e.g., 'feature/auth')"),
        force: z.boolean().optional().describe("Force resume even for older checkpoints"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ branch, force, repo_dir }) => {
      try {
        const args = ["resume", branch];
        if (force) args.push("--force");
        const { stdout } = await runEntire(args, { cwd: repoPath(repo_dir) });
        return {
          content: [{ type: "text", text: stdout || "Resume complete." }],
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
    "entire_attach",
    {
      title: "Attach Session",
      description: `Link an existing, untracked agent session to Entire's checkpoint system.
Uses \`entire attach <session-id>\`.`,
      inputSchema: z.object({
        session_id: z.string().describe("Session ID to attach (format: YYYY-MM-DD-uuid)"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ session_id, repo_dir }) => {
      try {
        const { stdout } = await runEntire(["attach", session_id], {
          cwd: repoPath(repo_dir),
        });
        return {
          content: [{ type: "text", text: stdout || "Attach complete." }],
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
    "entire_labs_review",
    {
      title: "Labs: Code Review",
      description: `Run the experimental Entire code review workflow on the current branch.
Uses \`entire labs review\`. This is a preview feature and may be unstable.`,
      inputSchema: z.object({
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ repo_dir }) => {
      try {
        const { stdout } = await runEntire(["labs", "review"], {
          cwd: repoPath(repo_dir),
          timeout: 120_000,
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
