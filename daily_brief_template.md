# Daily Brief Template

Use this as the target structure for each weekday morning run.

## Header

- Date: `YYYY-MM-DD`
- Time prepared: `8:00 AM` London time target
- Coverage window: since previous brief
- Market context: `risk-on | neutral | risk-off`

## 1. Executive Summary

- `Bullet 1: most important macro or AI-sector development`
- `Bullet 2: biggest portfolio-relevant takeaway`
- `Bullet 3: strongest new opportunity or warning`

## 2. Macro Setup

- Rates and yields:
  `What moved and why`
- Economic data:
  `What matters for growth and tech sentiment`
- Policy and geopolitics:
  `Tariffs, export controls, Fed signals, oil, dollar, or other broad risks`
- Market read-through:
  `Likely effect on growth stocks and AI names`

## 3. Portfolio Watchlist Impact

For each current holding:

### `[Ticker or Company]`

- What happened:
  `Fresh company-specific or sector-relevant news`
- Why it matters:
  `Key implication for revenue, margins, sentiment, or positioning`
- Likely impact:
  `bullish | neutral | bearish`
- Time horizon:
  `immediate | short term | medium term`

## 4. AI Sector Radar

- Compute and hyperscaler demand:
  `Key developments`
- Memory and HBM:
  `Key developments`
- Optics and networking:
  `Key developments`
- Storage and inference:
  `Key developments`
- Power, cooling, and infrastructure:
  `Key developments`
- Physical AI and robotics:
  `Key developments if material`

## 5. Opportunity and Watchlist Candidates

For each strong candidate not already in the watchlist:

### `[Company Name]`

- Ticker:
  `If known`
- Catalyst type:
  `earnings beat | raised guidance | customer win | design win | partnership | product launch | production ramp | capacity expansion | other`
- What happened:
  `Short factual summary`
- Why it matters:
  `Why this may matter for the stock or AI value chain`
- Impact scope:
  `company-specific | sector-wide | both`
- Suggested action:
  `add to watchlist | monitor only | ignore for now`
- Urgency:
  `watch_now | monitor | low_priority`

## 6. Market Outlook

- Base case:
  `Expected setup for the next U.S. session`
- Bullish scenario:
  `What would drive upside`
- Bearish scenario:
  `What would drive downside`
- Confidence:
  `low | medium | high`
- Key catalysts to watch:
  `1 to 3 items`

## 7. Candidate Queue Update

If there are new candidates, format them for `watchlist_candidates.json`:

```json
[
  {
    "company": "Example Company",
    "ticker": "EXM",
    "date_added": "YYYY-MM-DD",
    "catalyst_type": "customer win",
    "summary": "One-sentence description of the catalyst.",
    "why_it_matters": "Why the market may care.",
    "impact_scope": "both",
    "urgency": "watch_now",
    "status": "new"
  }
]
```
