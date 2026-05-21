import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TIME_ZONE = "Europe/London";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.4";

async function main() {
  const now = new Date();
  const london = getLondonParts(now);
  const forceRun = process.env.FORCE_RUN === "1" || process.env.GITHUB_EVENT_NAME === "workflow_dispatch";

  if (!forceRun && !shouldRunNow(london)) {
    console.log(`Skipping run at ${london.isoDate} ${london.time24} London time.`);
    return;
  }

  const briefPath = path.join(ROOT, "briefs", `${london.isoDate}.md`);
  if (!forceRun && (await exists(briefPath))) {
    console.log(`Brief already exists for ${london.isoDate}; skipping duplicate scheduled run.`);
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it as a GitHub Actions secret.");
  }

  const watchlistText = await readFile("portfolio_watchlist.json");
  const specText = await readFile("daily_brief_spec.md");
  const templateText = await readFile("daily_brief_template.md");
  const sourceMapText = await readFile("source_map.md");
  const promptText = await readFile("morning_brief_prompt.md");
  const currentCandidates = JSON.parse(await readFile("watchlist_candidates.json"));

  const responseJson = await fetchStructuredBrief({
    apiKey,
    london,
    watchlistText,
    specText,
    templateText,
    sourceMapText,
    promptText,
    currentCandidates,
  });

  const brief = JSON.parse(responseJson);
  const markdown = renderMarkdown(brief);
  const html = renderHtml(brief);
  const mergedCandidates = mergeCandidates(currentCandidates, brief.candidates, london.isoDate);

  await fs.mkdir(path.join(ROOT, "briefs"), { recursive: true });
  await fs.mkdir(path.join(ROOT, "site"), { recursive: true });

  await fs.writeFile(path.join(ROOT, "briefs", `${london.isoDate}.md`), markdown, "utf8");
  await fs.writeFile(path.join(ROOT, "site", "index.html"), html, "utf8");
  await fs.writeFile(path.join(ROOT, "site", "latest.json"), JSON.stringify(brief, null, 2), "utf8");
  await fs.writeFile(path.join(ROOT, "watchlist_candidates.json"), JSON.stringify(mergedCandidates, null, 2) + "\n", "utf8");

  console.log(`Generated brief for ${london.isoDate}.`);
}

function getLondonParts(date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    isoDate,
    weekday: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    time24: `${parts.hour}:${parts.minute}`,
  };
}

function shouldRunNow(london) {
  const weekday = london.weekday;
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  return isWeekday && london.hour === 8;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFile(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function fetchStructuredBrief({
  apiKey,
  london,
  watchlistText,
  specText,
  templateText,
  sourceMapText,
  promptText,
  currentCandidates,
}) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      header: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          iso_date: { type: "string" },
          prepared_time_london: { type: "string" },
          market_context: { type: "string" },
          coverage_window: { type: "string" },
        },
        required: ["title", "iso_date", "prepared_time_london", "market_context", "coverage_window"],
      },
      executive_summary: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
      },
      macro_setup: {
        type: "object",
        additionalProperties: false,
        properties: {
          rates_and_yields: { type: "string" },
          economic_data: { type: "string" },
          policy_and_geopolitics: { type: "string" },
          market_readthrough: { type: "string" },
        },
        required: ["rates_and_yields", "economic_data", "policy_and_geopolitics", "market_readthrough"],
      },
      holdings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            ticker: { type: ["string", "null"] },
            company: { type: "string" },
            what_happened: { type: "string" },
            why_it_matters: { type: "string" },
            likely_impact: { type: "string" },
            time_horizon: { type: "string" },
          },
          required: ["ticker", "company", "what_happened", "why_it_matters", "likely_impact", "time_horizon"],
        },
      },
      ai_sector_radar: {
        type: "object",
        additionalProperties: false,
        properties: {
          compute_and_hyperscaler_demand: { type: "string" },
          memory_and_hbm: { type: "string" },
          optics_and_networking: { type: "string" },
          storage_and_inference: { type: "string" },
          power_cooling_and_infrastructure: { type: "string" },
          physical_ai_and_robotics: { type: "string" },
        },
        required: [
          "compute_and_hyperscaler_demand",
          "memory_and_hbm",
          "optics_and_networking",
          "storage_and_inference",
          "power_cooling_and_infrastructure",
          "physical_ai_and_robotics",
        ],
      },
      candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            company: { type: "string" },
            ticker: { type: ["string", "null"] },
            catalyst_type: { type: "string" },
            what_happened: { type: "string" },
            why_it_matters: { type: "string" },
            impact_scope: { type: "string" },
            suggested_action: { type: "string" },
            urgency: { type: "string" },
          },
          required: [
            "company",
            "ticker",
            "catalyst_type",
            "what_happened",
            "why_it_matters",
            "impact_scope",
            "suggested_action",
            "urgency",
          ],
        },
      },
      market_outlook: {
        type: "object",
        additionalProperties: false,
        properties: {
          base_case: { type: "string" },
          bullish_scenario: { type: "string" },
          bearish_scenario: { type: "string" },
          confidence: { type: "string" },
          key_catalysts: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5,
          },
        },
        required: ["base_case", "bullish_scenario", "bearish_scenario", "confidence", "key_catalysts"],
      },
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            url: { type: "string" },
          },
          required: ["label", "url"],
        },
        minItems: 6,
      },
      notes: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "header",
      "executive_summary",
      "macro_setup",
      "holdings",
      "ai_sector_radar",
      "candidates",
      "market_outlook",
      "sources",
      "notes",
    ],
  };

  const systemPrompt = [
    "You are a disciplined buy-side style market brief generator.",
    "Use web search to gather current information before answering.",
    "Prioritize official company investor relations, company newsroom, SEC-equivalent filings, and high-quality financial reporting.",
    "Distinguish facts from inference.",
    "Focus on macroeconomy, AI sector developments, the supplied watchlist, and new positive AI-sector catalysts.",
    "Do not fabricate citations, prices, or time references.",
    "Be concise and selective. Prefer 6 to 10 high-value sources instead of broad exhaustive research.",
    `The target audience is in Europe/London, and today's London date is ${london.isoDate}.`,
  ].join(" ");

  const userPrompt = [
    `Generate the daily AI market brief for ${london.isoDate}.`,
    "Use current sources only and write for a UK-morning reader preparing for the next U.S. market session.",
    "If a holding has no fresh company-specific update, connect relevant sector or macro news back to it.",
    "Candidates should be non-watchlist companies only unless there is a compelling reason to revisit an existing candidate.",
    "Include source URLs in the sources array.",
    "",
    "Watchlist config:",
    watchlistText,
    "",
    "Current candidate queue:",
    JSON.stringify(currentCandidates, null, 2),
    "",
    "Brief spec:",
    specText,
    "",
    "Template guidance:",
    templateText,
    "",
    "Source guidance:",
    sourceMapText,
    "",
    "Prompt guidance:",
    promptText,
  ].join("\n");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: {
        effort: "low",
      },
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "web_search", search_context_size: "low" }],
      text: {
        format: {
          type: "json_schema",
          name: "daily_brief",
          schema,
          strict: true,
        },
      },
      max_output_tokens: 5000,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error(`OpenAI API response did not include extractable output text. Top-level keys: ${Object.keys(payload).join(", ")}`);
  }

  return outputText;
}

function mergeCandidates(existing, freshCandidates, isoDate) {
  const next = {
    ...existing,
    as_of: isoDate,
    candidates: [...(existing.candidates || [])],
  };

  for (const item of freshCandidates) {
    const normalized = {
      company: item.company,
      ticker: item.ticker,
      date_added: isoDate,
      catalyst_type: item.catalyst_type,
      summary: item.what_happened,
      why_it_matters: item.why_it_matters,
      impact_scope: item.impact_scope,
      urgency: normalizeUrgency(item.urgency),
      status: item.suggested_action === "add to watchlist" ? "reviewing" : "new",
    };

    const key = `${item.company}::${item.ticker || ""}`.toLowerCase();
    const index = next.candidates.findIndex(
      (candidate) => `${candidate.company}::${candidate.ticker || ""}`.toLowerCase() === key,
    );

    if (index >= 0) {
      next.candidates[index] = {
        ...next.candidates[index],
        ...normalized,
      };
    } else {
      next.candidates.push(normalized);
    }
  }

  return next;
}

function normalizeUrgency(value) {
  if (!value) return "monitor";
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_");
  if (["watch_now", "monitor", "low_priority"].includes(normalized)) {
    return normalized;
  }
  return "monitor";
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.length > 0) {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  const chunks = [];

  for (const item of payload.output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("").trim();
}

function renderMarkdown(brief) {
  const lines = [];
  lines.push("# Daily Brief", "");
  lines.push(`- Date: \`${brief.header.iso_date}\``);
  lines.push(`- Time prepared: \`${brief.header.prepared_time_london}\` London time`);
  lines.push(`- Coverage window: ${brief.header.coverage_window}`);
  lines.push(`- Market context: \`${brief.header.market_context}\``, "");

  lines.push("## 1. Executive Summary", "");
  for (const bullet of brief.executive_summary) {
    lines.push(`- ${bullet}`);
  }
  lines.push("", "## 2. Macro Setup", "");
  lines.push(`- Rates and yields:\n  ${brief.macro_setup.rates_and_yields}`);
  lines.push(`- Economic data:\n  ${brief.macro_setup.economic_data}`);
  lines.push(`- Policy and geopolitics:\n  ${brief.macro_setup.policy_and_geopolitics}`);
  lines.push(`- Market read-through:\n  ${brief.macro_setup.market_readthrough}`, "");

  lines.push("## 3. Portfolio Watchlist Impact", "");
  for (const holding of brief.holdings) {
    lines.push(`### \`${holding.ticker || holding.company}\``, "");
    lines.push(`- What happened:\n  ${holding.what_happened}`);
    lines.push(`- Why it matters:\n  ${holding.why_it_matters}`);
    lines.push(`- Likely impact:\n  \`${holding.likely_impact}\``);
    lines.push(`- Time horizon:\n  \`${holding.time_horizon}\``, "");
  }

  lines.push("## 4. AI Sector Radar", "");
  lines.push(`- Compute and hyperscaler demand:\n  ${brief.ai_sector_radar.compute_and_hyperscaler_demand}`);
  lines.push(`- Memory and HBM:\n  ${brief.ai_sector_radar.memory_and_hbm}`);
  lines.push(`- Optics and networking:\n  ${brief.ai_sector_radar.optics_and_networking}`);
  lines.push(`- Storage and inference:\n  ${brief.ai_sector_radar.storage_and_inference}`);
  lines.push(`- Power, cooling, and infrastructure:\n  ${brief.ai_sector_radar.power_cooling_and_infrastructure}`);
  lines.push(`- Physical AI and robotics:\n  ${brief.ai_sector_radar.physical_ai_and_robotics}`, "");

  lines.push("## 5. Opportunity and Watchlist Candidates", "");
  if (brief.candidates.length === 0) {
    lines.push("- No strong new non-watchlist candidates stood out today.", "");
  } else {
    for (const candidate of brief.candidates) {
      lines.push(`### \`${candidate.company}\``, "");
      lines.push(`- Ticker:\n  \`${candidate.ticker || "n/a"}\``);
      lines.push(`- Catalyst type:\n  \`${candidate.catalyst_type}\``);
      lines.push(`- What happened:\n  ${candidate.what_happened}`);
      lines.push(`- Why it matters:\n  ${candidate.why_it_matters}`);
      lines.push(`- Impact scope:\n  \`${candidate.impact_scope}\``);
      lines.push(`- Suggested action:\n  \`${candidate.suggested_action}\``);
      lines.push(`- Urgency:\n  \`${normalizeUrgency(candidate.urgency)}\``, "");
    }
  }

  lines.push("## 6. Market Outlook", "");
  lines.push(`- Base case:\n  ${brief.market_outlook.base_case}`);
  lines.push(`- Bullish scenario:\n  ${brief.market_outlook.bullish_scenario}`);
  lines.push(`- Bearish scenario:\n  ${brief.market_outlook.bearish_scenario}`);
  lines.push(`- Confidence:\n  \`${brief.market_outlook.confidence}\``);
  lines.push(`- Key catalysts to watch:\n  ${brief.market_outlook.key_catalysts.map((item) => `\`${item}\``).join(", ")}`, "");

  lines.push("## Sources", "");
  for (const source of brief.sources) {
    lines.push(`- [${source.label}](${source.url})`);
  }

  if (brief.notes.length > 0) {
    lines.push("", "## Notes", "");
    for (const note of brief.notes) {
      lines.push(`- ${note}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function renderHtml(brief) {
  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const impactClass = (value) => {
    const normalized = value.toLowerCase();
    if (normalized.includes("bull")) return "bullish";
    if (normalized.includes("bear")) return "bearish";
    return "neutral";
  };

  const urgencyClass = (value) => {
    const normalized = normalizeUrgency(value);
    if (normalized === "watch_now") return "watch-now";
    if (normalized === "low_priority") return "low-priority";
    return "monitor";
  };

  const holdingsHtml = brief.holdings
    .map(
      (holding) => `
          <article class="card">
            <h3>${escapeHtml(holding.ticker || holding.company)}</h3>
            <p>${escapeHtml(holding.what_happened)}</p>
            <p><strong>Why it matters:</strong> ${escapeHtml(holding.why_it_matters)}</p>
            <div class="label-row">
              <span class="label ${impactClass(holding.likely_impact)}">${escapeHtml(holding.likely_impact)}</span>
              <span class="label">${escapeHtml(holding.time_horizon)}</span>
              <span class="label">${escapeHtml(holding.company)}</span>
            </div>
          </article>`,
    )
    .join("\n");

  const candidatesHtml =
    brief.candidates.length === 0
      ? `
          <article class="card">
            <h3>No new watchlist candidates</h3>
            <p>No strong non-watchlist names cleared the bar today.</p>
          </article>`
      : brief.candidates
          .map(
            (candidate) => `
          <article class="card">
            <h3>${escapeHtml(candidate.company)}${candidate.ticker ? ` (${escapeHtml(candidate.ticker)})` : ""}</h3>
            <p>${escapeHtml(candidate.what_happened)}</p>
            <p><strong>Why it matters:</strong> ${escapeHtml(candidate.why_it_matters)}</p>
            <div class="label-row">
              <span class="label ${urgencyClass(candidate.urgency)}">${escapeHtml(normalizeUrgency(candidate.urgency).replaceAll("_", " "))}</span>
              <span class="label">${escapeHtml(candidate.catalyst_type)}</span>
              <span class="label">${escapeHtml(candidate.suggested_action)}</span>
            </div>
          </article>`,
          )
          .join("\n");

  const sourcesHtml = brief.sources
    .map(
      (source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`,
    )
    .join("\n");

  const notesHtml =
    brief.notes.length === 0
      ? ""
      : `
      <section class="panel">
        <h2>Notes</h2>
        <ul>
          ${brief.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </section>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(brief.header.title)}</title>
    <style>
      :root {
        --bg: #f4efe5;
        --panel: #fffaf2;
        --panel-strong: #f8f0df;
        --text: #1e1a16;
        --muted: #665f57;
        --line: #dccfb9;
        --accent: #8f4e1f;
        --bull: #22663c;
        --neutral: #8a6a24;
        --bear: #9a3027;
        --shadow: 0 18px 40px rgba(58, 41, 24, 0.09);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        background: radial-gradient(circle at top left, rgba(143, 78, 31, 0.13), transparent 28%), linear-gradient(180deg, #f7f2e9 0%, var(--bg) 100%);
        color: var(--text);
      }
      a { color: var(--accent); }
      .shell { max-width: 880px; margin: 0 auto; padding: 20px 14px 48px; }
      .hero {
        background: linear-gradient(145deg, rgba(255, 250, 242, 0.92), rgba(248, 240, 223, 0.98));
        border: 1px solid rgba(220, 207, 185, 0.9);
        border-radius: 28px;
        padding: 24px 20px;
        box-shadow: var(--shadow);
      }
      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1, h2, h3 { margin: 0; line-height: 1.1; }
      h1 { font-size: clamp(2rem, 6vw, 4rem); letter-spacing: -0.04em; }
      .hero p { margin: 14px 0 0; color: var(--muted); font-size: 1rem; line-height: 1.55; }
      .meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin-top: 18px;
      }
      .meta-card, .panel {
        background: rgba(255, 250, 242, 0.88);
        border: 1px solid var(--line);
        border-radius: 22px;
        box-shadow: var(--shadow);
      }
      .meta-card { padding: 14px 16px; }
      .meta-card strong { display: block; font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }
      .meta-card span { color: var(--muted); font-size: 0.95rem; }
      .grid { display: grid; gap: 14px; margin-top: 16px; }
      .panel { padding: 18px 18px 20px; }
      .panel h2 { font-size: 1.2rem; margin-bottom: 12px; }
      .panel p, .panel li { color: var(--muted); line-height: 1.6; }
      ul { padding-left: 18px; margin: 0; }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .chip {
        border-radius: 999px;
        padding: 8px 11px;
        border: 1px solid var(--line);
        background: var(--panel-strong);
        font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
        font-size: 0.84rem;
      }
      .holdings, .candidates { display: grid; gap: 12px; }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.55);
      }
      .card h3 { font-size: 1rem; margin-bottom: 8px; }
      .label-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
      .label {
        border-radius: 999px;
        padding: 5px 9px;
        font-size: 0.76rem;
        font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
        border: 1px solid var(--line);
      }
      .bullish, .watch-now {
        color: var(--bull);
        border-color: rgba(34, 102, 60, 0.24);
        background: rgba(34, 102, 60, 0.08);
      }
      .neutral, .monitor {
        color: var(--neutral);
        border-color: rgba(138, 106, 36, 0.24);
        background: rgba(138, 106, 36, 0.08);
      }
      .bearish, .low-priority {
        color: var(--bear);
        border-color: rgba(154, 48, 39, 0.24);
        background: rgba(154, 48, 39, 0.08);
      }
      .outlook { display: grid; gap: 10px; }
      .source-list { display: grid; gap: 8px; }
      .source-list a { text-decoration: none; }
      .footer-note { margin-top: 18px; color: var(--muted); font-size: 0.92rem; text-align: center; }
      @media (min-width: 760px) {
        .grid.two { grid-template-columns: 1.05fr 0.95fr; }
        .holdings, .candidates { grid-template-columns: 1fr 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">AI Market Brief</p>
        <h1>${escapeHtml(brief.header.title)}</h1>
        <p>A compact UK-morning view of the macro setup, your AI-linked holdings, and fresh opportunities that may matter before the next U.S. session.</p>
        <div class="meta">
          <div class="meta-card"><strong>Date</strong><span>${escapeHtml(brief.header.iso_date)}</span></div>
          <div class="meta-card"><strong>Prepared</strong><span>${escapeHtml(brief.header.prepared_time_london)} London time</span></div>
          <div class="meta-card"><strong>Market Context</strong><span>${escapeHtml(brief.header.market_context)}</span></div>
          <div class="meta-card"><strong>Coverage</strong><span>${escapeHtml(brief.header.coverage_window)}</span></div>
        </div>
        <div class="chips">
          <span class="chip">Macro</span>
          <span class="chip">AI sector</span>
          <span class="chip">Current holdings</span>
          <span class="chip">New candidates</span>
          <span class="chip">Next U.S. session</span>
        </div>
      </section>

      <section class="grid two">
        <article class="panel">
          <h2>Executive Summary</h2>
          <ul>${brief.executive_summary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </article>
        <article class="panel">
          <h2>Macro Setup</h2>
          <p><strong>Rates and yields:</strong> ${escapeHtml(brief.macro_setup.rates_and_yields)}</p>
          <p><strong>Economic data:</strong> ${escapeHtml(brief.macro_setup.economic_data)}</p>
          <p><strong>Policy and geopolitics:</strong> ${escapeHtml(brief.macro_setup.policy_and_geopolitics)}</p>
          <p><strong>Market read-through:</strong> ${escapeHtml(brief.macro_setup.market_readthrough)}</p>
        </article>
      </section>

      <section class="panel">
        <h2>Portfolio Watchlist Impact</h2>
        <div class="holdings">
${holdingsHtml}
        </div>
      </section>

      <section class="grid two">
        <article class="panel">
          <h2>AI Sector Radar</h2>
          <p><strong>Compute and hyperscaler demand:</strong> ${escapeHtml(brief.ai_sector_radar.compute_and_hyperscaler_demand)}</p>
          <p><strong>Memory and HBM:</strong> ${escapeHtml(brief.ai_sector_radar.memory_and_hbm)}</p>
          <p><strong>Optics and networking:</strong> ${escapeHtml(brief.ai_sector_radar.optics_and_networking)}</p>
          <p><strong>Storage and inference:</strong> ${escapeHtml(brief.ai_sector_radar.storage_and_inference)}</p>
          <p><strong>Power, cooling, and infrastructure:</strong> ${escapeHtml(brief.ai_sector_radar.power_cooling_and_infrastructure)}</p>
          <p><strong>Physical AI and robotics:</strong> ${escapeHtml(brief.ai_sector_radar.physical_ai_and_robotics)}</p>
        </article>
        <article class="panel">
          <h2>Market Outlook</h2>
          <div class="outlook">
            <p><strong>Base case:</strong> ${escapeHtml(brief.market_outlook.base_case)}</p>
            <p><strong>Bullish scenario:</strong> ${escapeHtml(brief.market_outlook.bullish_scenario)}</p>
            <p><strong>Bearish scenario:</strong> ${escapeHtml(brief.market_outlook.bearish_scenario)}</p>
            <p><strong>Confidence:</strong> ${escapeHtml(brief.market_outlook.confidence)}</p>
            <p><strong>Key catalysts:</strong> ${brief.market_outlook.key_catalysts.map(escapeHtml).join(", ")}</p>
          </div>
        </article>
      </section>

      <section class="panel">
        <h2>Opportunity Watch</h2>
        <div class="candidates">
${candidatesHtml}
        </div>
      </section>

      <section class="panel">
        <h2>Sources</h2>
        <div class="source-list">
${sourcesHtml}
        </div>
      </section>
${notesHtml}
      <p class="footer-note">Generated in the cloud and published automatically each UK morning.</p>
    </main>
  </body>
</html>`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
