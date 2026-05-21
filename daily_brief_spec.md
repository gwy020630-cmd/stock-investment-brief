# Daily Economy and AI Market Brief

Use `portfolio_watchlist.json` as the source of truth for current holdings and key themes.

## Goal

Produce a concise daily brief that explains:
- what changed in the macro backdrop,
- what matters for the AI sector,
- what is relevant to the current holdings in the watchlist,
- which positive AI-sector developments may create fresh opportunities,
- and what those developments may imply for the next market session.

## Inputs To Check Each Run

- Major macro news: Fed, rates, inflation, jobs, yields, oil, FX, geopolitics, tariffs, export controls
- AI platform news: NVIDIA, AMD, hyperscalers, foundries, memory vendors, networking vendors
- Earnings, guidance, management commentary, and official press releases tied to current holdings
- Sector themes from the watchlist such as HBM, optics, power, storage, and physical AI
- Newly announced partnerships, customer wins, design wins, joint ventures, supply agreements, and capital commitments
- Positive company-specific AI news such as earnings beats, raised guidance, new products, production ramps, pricing improvement, favorable capex commentary, and capacity expansions

## Output Format

### 1. Executive Summary

2 to 4 bullets on the most important market-moving developments since the previous brief.

### 2. Macro Setup

Explain the broad economy and market tone:
- risk-on or risk-off,
- what is driving rates and sentiment,
- and which macro items matter most for growth and tech.

### 3. Portfolio Watchlist Impact

For each current holding in `portfolio_watchlist.json`:
- what happened,
- why it matters,
- likely directional impact: bullish, neutral, bearish,
- and the time horizon: immediate, short term, medium term.

If there is no fresh company-specific news, connect sector or macro developments back to that name.

### 4. AI Sector Radar

Cover the most relevant AI-sector developments, especially:
- AI compute demand,
- memory and HBM,
- optical interconnects,
- inference and storage,
- power demand and energy infrastructure,
- physical AI and robotics if newly material.

### 5. Opportunity and Watchlist Candidates

Identify the most relevant positive AI-sector developments since the previous brief, including both company-specific catalysts and new relationships.

For each notable item:
- company name or companies involved,
- the catalyst type: earnings beat, raised guidance, partnership, supply deal, customer win, design win, product launch, production ramp, capacity expansion, financing, or acquisition-related tie-up,
- why the development matters,
- whether the impact looks company-specific or sector-wide,
- which company is likely to benefit most near term,
- whether the company should be added to the watchlist,
- and an urgency label: watch now, monitor, or low priority.

Prioritize positive catalysts tied to:
- AI chips and platforms,
- HBM and memory supply,
- optics and networking,
- data center buildout,
- power generation, transmission, cooling, and nuclear,
- robotics and physical AI,
- and second-order suppliers that the market may not have priced in yet.

### 6. Market Outlook

Provide:
- base case for the next session,
- bullish scenario,
- bearish scenario,
- confidence level,
- and the 1 to 3 catalysts most likely to change the view.

## Design Rules

- Do not assume the watchlist is fixed.
- Always read the current holdings from `portfolio_watchlist.json`.
- Always look for newly relevant companies that are not yet in the watchlist.
- Prioritize official company sources and primary materials when available.
- Distinguish facts from inference.
- Keep the brief decision-useful rather than exhaustive.
- When suggesting a new watchlist candidate, explain the positive catalyst clearly enough that the user can decide before the U.S. market opens.
