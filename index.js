const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

app.get("/contact-intelligence", async (req, res) => {
  const { url } = req.query;
  const cleanUrl = url?.trim().replace(/\/$/, "");

  if (!cleanUrl) {
    return res.status(400).json({
    answer: "Missing url parameter.",
    confidence: 0,
    contacts: [],
    sourceRefs: [],
    assumptions: [],
    knownUnknowns: ["URL parameter is required"],
    asOf: new Date().toISOString()
  });
  }

  try {
    if (!cleanUrl .startsWith("http")) {
      return res.status(400).json({
        answer: "Invalid URL provided.",
        confidence: 0,
        contacts: [],
        sourceRefs: [],
        assumptions: [],
        knownUnknowns: ["URL must start with http or https"],
        asOf: new Date().toISOString()
      });
    }
    const response = await axios.get(cleanUrl, {
      timeout: 10000, // 10s max
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      } 
    });
    const html = response.data;

    const $ = cheerio.load(html);

    const emails = new Set();

    // 1. Extract mailto emails (with source)
    $("a[href^='mailto:']").each((_, el) => {
      const raw = $(el).attr("href");
      if (!raw) return;

      const email = raw.replace("mailto:", "").trim();
      if (email) {
        emails.add(email + "|mailto");
      }
    });

    // 2. Extract emails from text (ALL matches)
    const text = $("body").text();
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

    const matches = text.match(emailRegex);
    if (matches) {
      matches.forEach(email => {
        emails.add(email.trim() + "|text");
      });
    }

    // 3. Transform into contacts
    let contacts = Array.from(emails).map(entry => {
      const [email, sourceRaw] = entry.split("|");

      const source = sourceRaw || "text";

      // 1. PRIORITY
      let priority = "low";
      const e = email.toLowerCase();

      if (
        e.includes("sales") ||
        e.includes("prodaja") ||
        e.includes("business") ||
        e.includes("contact")
      ) {
        priority = "high";
      } else if (
        e.includes("info") ||
        e.includes("support")
      ) {
        priority = "medium";
      }

      // 2. SCORE (after priority + source)
      let score = 0;

      if (priority === "high") score += 2;
      else if (priority === "medium") score += 1;

      if (source === "mailto") score += 1;

      return {
        type: "email",
        value: email,
        priority,
        source,
        score
      };
    });

    // 4. Extract LinkedIn
    const linkedinLinks = [];

    $("a[href*='linkedin.com']").each((_, el) => {
      const link = $(el).attr("href");
      if (link) linkedinLinks.push(link);
    });

    linkedinLinks.forEach(link => {
      contacts.push({
        type: "linkedin",
        value: link,
        priority: "medium",
        source: "social",
        score: 1
      });
    });

    const seen = new Set();

    contacts = contacts.filter(c => {
      if (seen.has(c.value)) return false;
      seen.add(c.value);
      return true;
    });

    contacts = contacts.sort((a, b) => b.score - a.score);

    // 5. Confidence scoring (improved)
    let confidence = 0;

    if (contacts.length === 0) {
      confidence = 0;
    } else {
      const best = contacts[0];

      // base
      confidence = 0.6;

      // HIGH priority boost
      if (best.priority === "high") {
        confidence += 0.2;
      } else if (best.priority === "medium") {
        confidence += 0.1;
      }

      // mailto boost
      if (best.source === "mailto") {
        confidence += 0.1;
      }

      // multiple contacts boost
      if (contacts.length > 1) {
        confidence += 0.05;
      }
    }

    // cap
    if (confidence > 0.95) confidence = 0.95;

    // 6. Generate answer
    let answer = "No reliable contact information found.";

    if (contacts.length > 0) {
      const best = contacts[0];

      if (best.type === "email") {
        answer = `The most relevant contact method is ${best.value}. This contact was identified as a ${best.priority} priority based on naming conventions and source reliability, making it the best available option for business inquiries.`;
      } else if (best.type === "linkedin") {
        answer = `The best available contact method is through LinkedIn: ${best.value}.`;
      }
    }

    contacts = contacts.map(c => ({
      type: c.type,
      value: c.value,
      priority: c.priority,
      source: c.source
    }));

    // 7. Final response
    res.json({
      answer,
      confidence,
      contacts,
      sourceRefs: contacts.map(c => ({
        type: c.source,
        value: c.value  
      })),
      assumptions: [
        "Emails containing 'sales' or 'info' are likely valid business contacts",
        "LinkedIn profiles may represent relevant business contacts"
      ],
      knownUnknowns: [
        "No verification of email activity",
        "Data limited to publicly available website content"
      ],
      asOf: new Date().toISOString()
    });

  } catch (error) {
    const status = error.response?.status;
      res.json({
        answer: "Website could not be fully accessed, returning partial or no contact data.",
        confidence: 0,
        contacts: [],
        sourceRefs: [],
        assumptions: [
          "Target website may block automated access (bot protection or firewall)"
        ],
        knownUnknowns: [
          status ? `HTTP ${status}` : error.message
        ],
        asOf: new Date().toISOString()
      });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});