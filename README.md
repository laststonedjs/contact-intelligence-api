# Contact Intelligence API

## Overview
Contact Intelligence API extracts and ranks publicly available business contact information (emails and LinkedIn profiles) from any website.

It returns structured, confidence-scored contact data optimized for outreach, lead generation, and automation workflows.

---

## Endpoint

GET /contact-intelligence?url=

---

## Example Request

http://localhost:3000/contact-intelligence?url=https://example.com

---

## Example Response

```json
{
  "answer": "The most relevant contact method is info@example.com.",
  "confidence": 0.9,
  "contacts": [
    {
      "type": "email",
      "value": "info@example.com",
      "priority": "high",
      "source": "mailto"
    }
  ],
  "sourceRefs": [
    {
      "type": "mailto",
      "value": "info@example.com"
    }
  ],
  "assumptions": [
    "Emails containing 'sales' or 'info' are likely valid business contacts"
  ],
  "knownUnknowns": [
    "No verification of email activity"
  ],
  "asOf": "2026-01-01T00:00:00.000Z"
}

---

## Features

- Extracts emails from:
  - mailto links
  - visible page content
- Detects LinkedIn profile links
- Deduplicates contact data
- Classifies contact priority (high / medium / low)
- Ranks contacts using heuristic scoring
- Generates confidence score for reliability
- Handles blocked websites gracefully (e.g. bot protection)

---

## How It Works

1. Fetches website HTML  
2. Parses DOM using Cheerio  
3. Extracts emails and social links  
4. Applies priority classification:
   - High: sales, contact, business  
   - Medium: info, support  
5. Scores and ranks contacts  
6. Returns structured JSON response  

---

## Use Cases

- Lead generation  
- Sales outreach  
- Recruiting  
- Market research  
- Automation pipelines  

---

## MCP Integration

This project includes an MCP-compatible wrapper (`mcp-server.js`) allowing integration with Context Protocol tools.

---

## Local Setup

```bash
npm install
node index.js

---

## Notes
- Some websites may block automated requests (HTTP 403)
- In such cases, the API returns a structured fallback response
- Designed for sub-60s response time
