# Publishing Guide

This project is ready for GitHub Pages deployment.

## What Is Already Set Up

- Local Git repository initialized on `main`
- GitHub Pages workflow in `.github/workflows/deploy-pages.yml`
- Mobile-friendly site output in `site/index.html`
- Morning automation that refreshes the page content each weekday

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

## Notes

- The current local setup is ready for this.
- If you want, the next step is to wire the morning automation so it also commits and pushes automatically after each update.
