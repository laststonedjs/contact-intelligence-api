const { Server } = require("@modelcontextprotocol/sdk/server");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio");

// 🔥 PRODUCTION BASE URL
const BASE_URL =
  process.env.BASE_URL ||
  "https://contact-intelligence-api-production.up.railway.app";

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
    description:
      "Extracts and ranks business contact information (emails, LinkedIn) from a website and returns structured, confidence-scored results.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" }
      },
      required: ["url"]
    }
  },
  async ({ url }) => {
    try {
      const res = await fetch(
        `${BASE_URL}/contact-intelligence?url=${encodeURIComponent(url)}`
      );

      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              answer: "Failed to fetch contact intelligence.",
              confidence: 0,
              contacts: [],
              error: error.message
            })
          }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);