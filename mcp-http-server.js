const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// PRODUCTION API URL
const BASE_URL =
  "https://contact-intelligence-api-production.up.railway.app";

// MCP endpoint
app.post("/mcp", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: "Missing url parameter"
    });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/contact-intelligence?url=${encodeURIComponent(url)}`
    );

    const data = await response.json();

    // MCP-compatible response
    return res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch contact intelligence",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP HTTP server running on port ${PORT}`);
});