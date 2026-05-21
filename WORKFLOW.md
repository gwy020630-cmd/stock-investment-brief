# AI Market Brief Workflow

This workspace is set up to support a weekday UK-morning investing brief that helps prepare for the U.S. market open.

## What This Workflow Does

Each weekday morning, the brief should:
- summarize the most important macro and AI-sector developments,
- explain the likely impact on the current holdings in `portfolio_watchlist.json`,
- surface positive AI-sector catalysts for companies not yet in the watchlist,
- and help decide what deserves attention before the U.S. session begins.

## Core Files

- `portfolio_watchlist.json`: current holdings, themes, and discovery focus
- `daily_brief_spec.md`: structure and decision rules for the brief
- `morning_brief_prompt.md`: reusable prompt for the daily run
- `source_map.md`: source priority and coverage map
- `watchlist_candidates.json`: candidate companies identified by the morning brief
- `site/index.html`: mobile-friendly latest brief page
- `PUBLISHING.md`: GitHub Pages deployment notes
- `scripts/generate-brief.mjs`: cloud generator that calls the OpenAI Responses API
- `.github/workflows/generate-brief.yml`: GitHub Actions schedule for the cloud run

## Daily Operating Flow

1. Read `portfolio_watchlist.json`.
2. Check macro, AI-sector, and company-specific sources from `source_map.md`.
3. Produce the brief using `daily_brief_spec.md` and `morning_brief_prompt.md`.
4. Add any newly relevant names to `watchlist_candidates.json`.
5. Review the candidates before the U.S. market opens.
6. If a candidate becomes important enough, move it into `portfolio_watchlist.json`.
7. The cloud workflow commits and pushes the refreshed files so GitHub Pages updates automatically.

## How To Maintain It

- Edit `portfolio_watchlist.json` whenever your holdings change.
- Use `watchlist_candidates.json` for names you want to monitor before promoting them to the main watchlist.
- Update themes in `portfolio_watchlist.json` if your investment focus changes beyond AI infrastructure.

## UK Timing

The brief is intended for weekday mornings in the UK so you have time to review it before the U.S. cash market opens.

Typical timing:
- Delivery target: `8:00 AM` London time
- U.S. market open during UK summer time: `2:30 PM` London time
- U.S. market open during UK winter time: `3:30 PM` London time

The GitHub Actions schedule runs hourly on weekdays and the generator itself only proceeds when the local `Europe/London` hour is `8`, which keeps the workflow aligned with BST and GMT.

## Decision Standard

The workflow is meant to be practical rather than exhaustive.

Candidate names should usually be promoted only if one or more of these are true:
- the catalyst is both recent and material,
- the company has direct AI exposure rather than only broad thematic exposure,
- the news likely affects estimates, sentiment, or positioning,
- or the market may not yet have fully priced the implication.
