const { Server } = require("@modelcontextprotocol/sdk/server");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const server = new Server(
  {
    name: "contact-intelligence",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.tool(
  "contact-intelligence",
  {
    description: "Extracts and ranks business contact information from a website",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" }
      },
      required: ["url"]
    }
  },
  async ({ url }) => {
    const res = await fetch(
      `${BASE_URL}/contact-intelligence?url=${encodeURIComponent(url)}`
    );

    const data = await res.json();
    return data;
  }
);

const transport = new StdioServerTransport();
server.connect(transport);