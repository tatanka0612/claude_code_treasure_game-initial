Deploy this project's frontend to GitHub Pages and return the live URL when done.

Follow these steps in order:

## Step 1 — Ensure a GitHub remote exists

Run `git remote get-url origin` to check for a remote.

If **no remote exists**:

### 1a — Ensure `gh` CLI is installed
Run `gh --version` to check.

If **not installed**:
- On macOS: `brew install gh`
- On Windows: `winget install --id GitHub.cli`
- On Linux (apt): `sudo apt install gh`

After installing, verify with `gh --version` before continuing.

### 1b — Authenticate with GitHub
Run `gh auth status` to check if already logged in.

If **not authenticated**, ask the user to run:
```
! gh auth login
```
Wait for confirmation that login succeeded before continuing.

### 1c — Initialise git and create the GitHub repo
Run the following in sequence:
```bash
git init
git add .
git commit -m "initial commit"
gh repo create <repo-name> --public --source=. --remote=origin --push
```
Use the current directory name as `<repo-name>`.

If a remote already exists, skip to Step 2.

## Step 2 — Install gh-pages if needed

Run: `npm list gh-pages --depth=0`

If not installed: `npm install --save-dev gh-pages`

## Step 3 — Set the Vite base path

Run `git remote get-url origin` and parse the repo name from the URL.

GitHub Pages serves at `https://<username>.github.io/<repo-name>/`, so Vite needs a matching `base`.

Check `vite.config.ts` — if `base` is not already set to `/<repo-name>/`, update it:
```ts
export default defineConfig({
  base: '/<repo-name>/',
  // ... rest of config
});
```

## Step 4 — Add deploy scripts to package.json

Check if `predeploy` and `deploy` scripts already exist in `package.json`. If not, add:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```

## Step 5 — Deploy

Run: `npm run deploy`

This builds the frontend and pushes the `build/` output to the `gh-pages` branch on GitHub.

If the push fails with an auth error, ask the user to run `! gh auth login` and retry.

## Step 6 — Return the live URL

Parse `<username>` and `<repo-name>` from the remote URL, then report:
```
https://<username>.github.io/<repo-name>/
```

Note: GitHub Pages can take 1–2 minutes to go live on the first deploy.

Also note: This deploys the **frontend only** — the Express/SQLite backend is not included. Auth and score features will not work unless the backend is hosted separately.
