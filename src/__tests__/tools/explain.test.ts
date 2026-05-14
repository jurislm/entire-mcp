import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../cli.js", () => ({
  runEntire: vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  repoPath: vi.fn((x?: string) => x),
}));

import { runEntire } from "../../cli.js";
import { registerExplainTools } from "../../tools/explain.js";

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

describe("entire_explain_commit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire explain --commit <SHA> --no-pager`", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "Transcript...\n", stderr: "" });
    const server = makeServer();
    registerExplainTools(server);
    await server.callTool("entire_explain_commit", { commit: "abc123def456" });
    expect(runEntire).toHaveBeenCalledWith(
      ["explain", "--commit", "abc123def456", "--no-pager"],
      expect.any(Object)
    );
  });

  it("returns stdout content", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "Session context...\n", stderr: "" });
    const server = makeServer();
    registerExplainTools(server);
    const result = await server.callTool("entire_explain_commit", { commit: "abc123" }) as { content: { text: string }[] };
    expect(result.content[0].text).toContain("Session context");
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("no transcript for commit abc000"));
    const server = makeServer();
    registerExplainTools(server);
    const result = await server.callTool("entire_explain_commit", { commit: "abc000" }) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});

describe("entire_explain_checkpoint (with flags)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire explain --checkpoint <ID> --no-pager` by default", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "Checkpoint...\n", stderr: "" });
    const server = makeServer();
    registerExplainTools(server);
    await server.callTool("entire_explain_checkpoint", { checkpoint_id: "a3b2c4d5e6f7" });
    expect(runEntire).toHaveBeenCalledWith(
      ["explain", "--checkpoint", "a3b2c4d5e6f7", "--no-pager"],
      expect.any(Object)
    );
  });

  it("appends --full when mode is 'full'", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "Full...\n", stderr: "" });
    const server = makeServer();
    registerExplainTools(server);
    await server.callTool("entire_explain_checkpoint", { checkpoint_id: "a3b2c4d5e6f7", mode: "full" });
    expect(runEntire).toHaveBeenCalledWith(
      ["explain", "--checkpoint", "a3b2c4d5e6f7", "--full", "--no-pager"],
      expect.any(Object)
    );
  });

  it("appends --raw-transcript when mode is 'raw'", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: '{"type":"message"}\n', stderr: "" });
    const server = makeServer();
    registerExplainTools(server);
    await server.callTool("entire_explain_checkpoint", { checkpoint_id: "a3b2c4d5e6f7", mode: "raw" });
    expect(runEntire).toHaveBeenCalledWith(
      ["explain", "--checkpoint", "a3b2c4d5e6f7", "--raw-transcript", "--no-pager"],
      expect.any(Object)
    );
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("checkpoint not found"));
    const server = makeServer();
    registerExplainTools(server);
    const result = await server.callTool("entire_explain_checkpoint", { checkpoint_id: "bad" }) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});
