Deploy this project to Vercel and return the live URL.

Follow these steps in order:

## Step 1 — Check Vercel CLI
Run `vercel --version` to check if the Vercel CLI is installed.
If it is NOT installed, install it globally: `npm install -g vercel`

## Step 2 — Ensure vercel.json exists
Check if `vercel.json` exists in the project root. If it does NOT exist, create it with this content:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ]
}
```

Also check if `api/index.js` exists. If it does NOT exist, create the `api/` directory and `api/index.js` that exports the Express app as a serverless function:

```js
const app = require('../server/index');
module.exports = app;
```

Note: If the server uses TypeScript exports or ES modules, adapt accordingly.

## Step 3 — Deploy
Run: `vercel --prod --yes`

If prompted to log in, tell the user to run `! vercel login` in their terminal.

## Step 4 — Report URL
After a successful deploy, parse the output for the production URL (looks like `https://<project>.vercel.app`) and report it clearly to the user.

If the deploy fails, read the error output carefully, diagnose the issue, fix it, and re-run the deploy.
