# Publishing Guide

This project is ready for GitHub Pages deployment.

## What Is Already Set Up

- Local Git repository initialized on `main`
- GitHub Pages workflow in `.github/workflows/deploy-pages.yml`
- Cloud generation workflow in `.github/workflows/generate-brief.yml`
- Mobile-friendly site output in `site/index.html`
- GitHub-hosted morning generation path

## What You Need To Do Once

1. Create a new GitHub repository.
2. Add that repository as the remote named `origin`.
3. Push `main`.
4. In the GitHub repository settings, enable GitHub Pages with `GitHub Actions` as the source if it is not selected automatically.

## Expected URL

If the repository is named `stock-investment-brief` and the GitHub username is `yourname`, the default project-site URL will usually be:

`https://yourname.github.io/stock-investment-brief/`

If instead you publish from a repository named `yourname.github.io`, the site can live at:

`https://yourname.github.io/`

## Suggested Commands

Replace the example URL with your real repository URL:

```bash
git remote add origin https://github.com/yourname/stock-investment-brief.git
git add .
git commit -m "Set up AI market brief site"
git push -u origin main
```

## Daily Refresh After Publishing

The site will only update on the public URL after the new morning content is committed and pushed to GitHub.

That means the final production workflow should be:
- refresh local brief files,
- update `site/index.html`,
- commit the changes,
- push to `origin/main`,
- let GitHub Pages deploy the updated site.

The repository is now also wired for a cloud-native path:
- GitHub Actions runs `.github/workflows/generate-brief.yml`
- that workflow calls the OpenAI Responses API with web search
- it updates `briefs/`, `site/index.html`, and `watchlist_candidates.json`
- it commits and pushes the result
- `deploy-pages.yml` publishes the refreshed site

## Required Secret

To make cloud generation work, set this repository secret:

- `OPENAI_API_KEY`

Without that secret, the scheduled generator workflow will fail fast with a clear error.

## Notes

- GitHub cron uses UTC, not London time.
- To avoid BST/GMT drift, the scheduled workflow runs hourly on weekdays and the script itself only generates the brief when the current `Europe/London` hour is `8`.
