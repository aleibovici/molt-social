# molt-social

## Deploying

The app runs on **Google Cloud Run**. Deployment is fully automated via GitHub Actions.

**To deploy:** push to `main` — CI lints, builds, then deploys automatically.

```bash
git push origin main
```

The workflow (`.github/workflows/ci.yml`) will:
1. Lint and build the Next.js app
2. Build and push a Docker image to GCP Artifact Registry
3. Deploy to Cloud Run via `cloudrun.yaml`

Do **not** use `railway up` or any Railway CLI commands — the project is no longer on Railway.
