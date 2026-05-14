import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../cli.js", () => ({
  runEntire: vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  repoPath: vi.fn((x?: string) => x),
}));

import { runEntire } from "../../cli.js";
import { registerSearchTools } from "../../tools/search.js";

function makeServer() {
  const handlers = new Map<string, (params: Record<string, unknown>) => Promise<unknown>>();
  const server = {
    registerTool: vi.fn((name: string, _config: unknown, handler: (p: Record<string, unknown>) => Promise<unknown>) => {
      handlers.set(name, handler);
    }),
    callTool: (name: string, params: Record<string, unknown>) => {
      const h = handlers.get(name);
      if (!h) throw new Error(`tool ${name} not registered`);
      return h(params);
    },
  };
  return server as unknown as McpServer & { callTool: typeof server.callTool };
}

describe("entire_search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire search <query>` with query as first arg", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "3 results\n", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "auth refactor" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["search", "auth refactor"]),
      expect.any(Object)
    );
  });

  it("always passes --json for machine-readable output in non-interactive MCP context", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "{}", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "auth" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--json"]),
      expect.any(Object)
    );
  });

  it("appends --limit when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "{}", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "auth", limit: 10 });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--limit", "10"]),
      expect.any(Object)
    );
  });

  it("appends --page when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "{}", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "auth", page: 2 });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--page", "2"]),
      expect.any(Object)
    );
  });

  it("appends --repo when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "1 result\n", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "login", repo: "jurislm/entire" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--repo", "jurislm/entire"]),
      expect.any(Object)
    );
  });

  it("appends --branch when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "0 results\n", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "deploy", branch: "main" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--branch", "main"]),
      expect.any(Object)
    );
  });

  it("appends --author when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "2 results\n", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "fix", author: "Terry" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--author", "Terry"]),
      expect.any(Object)
    );
  });

  it("appends --date when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "1 result\n", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    await server.callTool("entire_search", { query: "refactor", date: "week" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--date", "week"]),
      expect.any(Object)
    );
  });

  it("returns 'No results' message when stdout is empty", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "", stderr: "" });
    const server = makeServer();
    registerSearchTools(server);
    const result = await server.callTool("entire_search", { query: "xyz" }) as { content: { text: string }[] };
    expect(result.content[0].text).toBeTruthy();
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("auth required"));
    const server = makeServer();
    registerSearchTools(server);
    const result = await server.callTool("entire_search", { query: "test" }) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});
