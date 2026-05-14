import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../cli.js", () => ({
  runEntire: vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  repoPath: vi.fn((x?: string) => x),
}));

import { runEntire } from "../../cli.js";
import { registerSessionTools } from "../../tools/session.js";

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

describe("entire_session_current", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire session current --json`", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: '{"session_id":"abc"}', stderr: "" });
    const server = makeServer();
    registerSessionTools(server);
    await server.callTool("entire_session_current", {});
    expect(runEntire).toHaveBeenCalledWith(
      ["session", "current", "--json"],
      expect.any(Object)
    );
  });

  it("passes repo_dir to cwd", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: '{"session_id":"abc"}', stderr: "" });
    const server = makeServer();
    registerSessionTools(server);
    await server.callTool("entire_session_current", { repo_dir: "/my/repo" });
    expect(runEntire).toHaveBeenCalledWith(
      ["session", "current", "--json"],
      { cwd: "/my/repo" }
    );
  });

  it("returns stdout content", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: '{"session_id":"abc123"}', stderr: "" });
    const server = makeServer();
    registerSessionTools(server);
    const result = await server.callTool("entire_session_current", {}) as { content: { text: string }[] };
    expect(result.content[0].text).toContain("abc123");
  });

  it("returns fallback when stdout is empty", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "", stderr: "" });
    const server = makeServer();
    registerSessionTools(server);
    const result = await server.callTool("entire_session_current", {}) as { content: { text: string }[] };
    expect(result.content[0].text).toBeTruthy();
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("no active session"));
    const server = makeServer();
    registerSessionTools(server);
    const result = await server.callTool("entire_session_current", {}) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});
