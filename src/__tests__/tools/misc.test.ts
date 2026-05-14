import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../cli.js", () => ({
  runEntire: vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  repoPath: vi.fn((x?: string) => x),
}));

import { runEntire } from "../../cli.js";
import { registerMiscTools } from "../../tools/misc.js";

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

describe("entire_version", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire version` with no args", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "entire version 0.6.1\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_version", {});
    expect(runEntire).toHaveBeenCalledWith(["version"], { cwd: undefined });
  });

  it("returns stdout content", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "entire version 0.6.1\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    const result = await server.callTool("entire_version", {}) as { content: { text: string }[] };
    expect(result.content[0].text).toContain("0.6.1");
  });

  it("returns fallback when stdout is empty", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    const result = await server.callTool("entire_version", {}) as { content: { text: string }[] };
    expect(result.content[0].text).toBeTruthy();
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("entire not found"));
    const server = makeServer();
    registerMiscTools(server);
    const result = await server.callTool("entire_version", {}) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});

describe("entire_dispatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire dispatch` with no args by default", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "dispatch output\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_dispatch", {});
    expect(runEntire).toHaveBeenCalledWith(["dispatch"], expect.any(Object));
  });

  it("appends --local when local is true", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "local dispatch\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_dispatch", { local: true });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--local"]),
      expect.any(Object)
    );
  });

  it("appends --repos when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "repo dispatch\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_dispatch", { repos: ["jurislm/entire", "jurislm/mcp"] });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--repos", "jurislm/entire,jurislm/mcp"]),
      expect.any(Object)
    );
  });

  it("appends --since when provided", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "dispatch\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_dispatch", { since: "3d" });
    expect(runEntire).toHaveBeenCalledWith(
      expect.arrayContaining(["--since", "3d"]),
      expect.any(Object)
    );
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("auth required"));
    const server = makeServer();
    registerMiscTools(server);
    const result = await server.callTool("entire_dispatch", {}) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});

describe("entire_activity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire activity`", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "activity data\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_activity", {});
    expect(runEntire).toHaveBeenCalledWith(["activity"], { cwd: undefined });
  });

  it("passes repo_dir to cwd", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "data\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_activity", { repo_dir: "/my/repo" });
    expect(runEntire).toHaveBeenCalledWith(["activity"], { cwd: "/my/repo" });
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("auth required"));
    const server = makeServer();
    registerMiscTools(server);
    const result = await server.callTool("entire_activity", {}) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});

describe("entire_status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls `entire status`", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "session: abc123\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_status", {});
    expect(runEntire).toHaveBeenCalledWith(["status"], { cwd: undefined });
  });

  it("passes repo_dir to cwd", async () => {
    vi.mocked(runEntire).mockResolvedValueOnce({ stdout: "session: abc123\n", stderr: "" });
    const server = makeServer();
    registerMiscTools(server);
    await server.callTool("entire_status", { repo_dir: "/my/repo" });
    expect(runEntire).toHaveBeenCalledWith(["status"], { cwd: "/my/repo" });
  });

  it("returns isError on CLI failure", async () => {
    vi.mocked(runEntire).mockRejectedValueOnce(new Error("no session"));
    const server = makeServer();
    registerMiscTools(server);
    const result = await server.callTool("entire_status", {}) as { isError: boolean };
    expect(result.isError).toBe(true);
  });
});
