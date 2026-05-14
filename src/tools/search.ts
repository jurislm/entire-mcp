import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runEntire, repoPath } from "../cli.js";

const RepoDirSchema = z
  .string()
  .optional()
  .describe("Absolute path to the git repo. Falls back to ENTIRE_REPO_PATH env var.");

export function registerSearchTools(server: McpServer): void {
  server.registerTool(
    "entire_search",
    {
      title: "Search Checkpoints",
      description: `Search Entire checkpoints by query with optional filters.

Uses \`entire search "<query>"\` — the stable search command (not \`checkpoint search --json\`).

Filters:
- repo: "owner/name" or "owner/*"
- branch: branch name
- author: author name
- date: "week", "month", or "all"`,
      inputSchema: z.object({
        query: z.string().describe("Search query (topic, feature name, error text, file name, etc.)"),
        repo: z.string().optional().describe('Repository filter, e.g. "jurislm/entire" or "owner/*"'),
        branch: z.string().optional().describe("Branch filter"),
        author: z.string().optional().describe("Author name filter"),
        date: z.enum(["week", "month", "all"]).optional().describe("Time window filter"),
        limit: z.number().int().positive().optional().describe("Max results per page (default 25)"),
        page: z.number().int().positive().optional().describe("Page number, 1-based (default 1)"),
        repo_dir: RepoDirSchema,
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ query, repo, branch, author, date, limit, page, repo_dir }) => {
      try {
        const args = ["search", query, "--json"];
        if (repo) args.push("--repo", repo);
        if (branch) args.push("--branch", branch);
        if (author) args.push("--author", author);
        if (date) args.push("--date", date);
        if (limit !== undefined) args.push("--limit", String(limit));
        if (page !== undefined) args.push("--page", String(page));

        const { stdout } = await runEntire(args, { cwd: repoPath(repo_dir) });
        return {
          content: [{ type: "text", text: stdout || "No results found." }],
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
