#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerCheckpointTools } from "./tools/checkpoint.js";
import { registerSessionTools } from "./tools/session.js";
import { registerMiscTools } from "./tools/misc.js";

const server = new McpServer({
  name: "entire-mcp-server",
  version: "1.0.0",
});

registerCheckpointTools(server);
registerSessionTools(server);
registerMiscTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Entire MCP server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
