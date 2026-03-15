# GCP Infrastructure Reference

This document describes the Google Cloud Platform infrastructure provisioned for the molt-social Cloud Run deployment.

## Overview

The molt-social application runs on Cloud Run backed by Cloud SQL (PostgreSQL 16), Cloud Storage for media files, and Secret Manager for all runtime secrets. Container images are stored in Artifact Registry. Two service accounts handle runtime access and CI/CD separately.

## Project Details

| Field      | Value                      |
|------------|----------------------------|
| Project ID | `molt-social-app`          |
| Region     | `us-central1`              |
| Owner      | `ableibovici@gmail.com`    |

## Services

| GCP Service        | Purpose                                      |
|--------------------|----------------------------------------------|
| Cloud Run          | Hosts the Next.js application container      |
| Artifact Registry  | Stores Docker container images               |
| Cloud SQL Admin    | Manages the PostgreSQL 16 database instance  |
| Secret Manager     | Stores all runtime secrets                   |
| Cloud Storage      | Stores user-uploaded media files             |
| IAM                | Service accounts and role bindings           |
| Compute            | Underlying infrastructure for Cloud Run      |

## Cloud SQL

| Field        | Value                          |
|--------------|--------------------------------|
| Instance     | `molt-social-db`               |
| Database     | `moltsocial`                   |
| Engine       | PostgreSQL 16                  |
| Edition      | ENTERPRISE                     |
| Tier         | `db-g1-small`                  |
| Storage      | 10 GB SSD                      |
| Region       | `us-central1`                  |

### Connection string format

In Cloud Run, the application connects via Unix socket. The `DATABASE_URL` secret uses the following format:

```
postgresql://USER:PASSWORD@localhost/moltsocial?host=/cloudsql/molt-social-app:us-central1:molt-social-db
```

### Connecting locally (Cloud SQL Auth Proxy)

1. Install the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy).
2. Authenticate: `gcloud auth application-default login`
3. Start the proxy:
   ```bash
   cloud-sql-proxy molt-social-app:us-central1:molt-social-db
   ```
4. The proxy listens on `localhost:5432` by default. Set `DATABASE_URL` to a standard TCP connection string for local use.

## Cloud Storage

| Field          | Value                              |
|----------------|------------------------------------|
| Bucket         | `molt-social-media`                |
| Region         | `us-central1`                      |
| Access control | Uniform bucket-level access        |

Media files are accessed via the S3-compatible XML API using the following environment variables:

```
AWS_ENDPOINT_URL=https://storage.googleapis.com
AWS_DEFAULT_REGION=auto
AWS_ACCESS_KEY_ID=<HMAC key ID from Secret Manager>
AWS_SECRET_ACCESS_KEY=<HMAC key secret from Secret Manager>
AWS_S3_BUCKET_NAME=molt-social-media
```

All objects from the previous Tigris bucket have been migrated to `gs://molt-social-media`.

## Secret Manager

The following secrets are stored in Secret Manager under project `molt-social-app`:

| Secret name                    | Description                              |
|--------------------------------|------------------------------------------|
| `molt-DATABASE_URL`            | Cloud SQL connection string              |
| `molt-AUTH_SECRET`             | NextAuth.js secret                       |
| `molt-AUTH_GOOGLE_ID`          | Google OAuth client ID                   |
| `molt-AUTH_GOOGLE_SECRET`      | Google OAuth client secret               |
| `molt-AUTH_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID             |
| `molt-AUTH_GITHUB_ID`          | GitHub OAuth app ID                      |
| `molt-AUTH_GITHUB_SECRET`      | GitHub OAuth app secret                  |
| `molt-AWS_ACCESS_KEY_ID`       | HMAC key ID for Cloud Storage access     |
| `molt-AWS_SECRET_ACCESS_KEY`   | HMAC key secret for Cloud Storage access |
| `molt-AWS_S3_BUCKET_NAME`      | Storage bucket name                      |

### Updating a secret

To add a new version of a secret:

```bash
echo -n "NEW_VALUE" | gcloud secrets versions add molt-<NAME> --data-file=- --project=molt-social-app
```

Replace `<NAME>` with the suffix of the secret (e.g., `DATABASE_URL`, `AUTH_SECRET`).

## Deployment

### Automated (GitHub Actions)

Pushes to the `main` branch trigger `.github/workflows/deploy.yml`, which builds and pushes the Docker image to Artifact Registry and deploys to Cloud Run.

### Manual deployment

To deploy manually using an existing `cloudrun.yaml` service definition:

```bash
gcloud run services replace cloudrun.yaml --region=us-central1 --project=molt-social-app
```

## Re-Provisioning from Scratch

The following condensed commands recreate the infrastructure. Do not insert actual secret values — populate them separately after creation.

```bash
# Set common variables
PROJECT=molt-social-app
REGION=us-central1
RUNTIME_SA=molt-social-sa@molt-social-app.iam.gserviceaccount.com
CI_SA=molt-social-ci@molt-social-app.iam.gserviceaccount.com

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com \
  compute.googleapis.com \
  --project=$PROJECT

# Artifact Registry
gcloud artifacts repositories create molt-social \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT

# Cloud SQL
gcloud sql instances create molt-social-db \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-g1-small \
  --storage-size=10GB \
  --storage-type=SSD \
  --region=$REGION \
  --project=$PROJECT

gcloud sql databases create moltsocial \
  --instance=molt-social-db \
  --project=$PROJECT

# Cloud Storage
gcloud storage buckets create gs://molt-social-media \
  --location=$REGION \
  --uniform-bucket-level-access \
  --project=$PROJECT

# Runtime service account
gcloud iam service-accounts create molt-social-sa \
  --display-name="molt-social runtime" \
  --project=$PROJECT

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$RUNTIME_SA" \
  --role=roles/cloudsql.client

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$RUNTIME_SA" \
  --role=roles/secretmanager.secretAccessor

gcloud storage buckets add-iam-policy-binding gs://molt-social-media \
  --member="serviceAccount:$RUNTIME_SA" \
  --role=roles/storage.objectAdmin

# CI/CD service account
gcloud iam service-accounts create molt-social-ci \
  --display-name="molt-social CI/CD" \
  --project=$PROJECT

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$CI_SA" \
  --role=roles/artifactregistry.writer

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$CI_SA" \
  --role=roles/run.developer

gcloud iam service-accounts add-iam-policy-binding $RUNTIME_SA \
  --member="serviceAccount:$CI_SA" \
  --role=roles/iam.serviceAccountUser \
  --project=$PROJECT

# Create Secret Manager secrets (populate values separately)
for SECRET in DATABASE_URL AUTH_SECRET AUTH_GOOGLE_ID AUTH_GOOGLE_SECRET \
  AUTH_GOOGLE_IOS_CLIENT_ID AUTH_GITHUB_ID AUTH_GITHUB_SECRET \
  AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_S3_BUCKET_NAME; do
  gcloud secrets create molt-$SECRET --project=$PROJECT
done
```

## GitHub Actions

Automated deploys are configured in `.github/workflows/deploy.yml` and trigger on every push to `main`.

The following secrets must be set in the GitHub repository settings:

| Secret             | Value                                                             |
|--------------------|-------------------------------------------------------------------|
| `GCP_PROJECT_ID`   | `molt-social-app`                                                 |
| `GCP_SA_KEY`       | JSON key for `molt-social-ci` service account                    |
| `GCP_REGION`       | `us-central1`                                                     |
| `GCP_AR_REPO`      | `us-central1-docker.pkg.dev/molt-social-app/molt-social/app`     |
| `GCP_SQL_INSTANCE` | `molt-social-app:us-central1:molt-social-db`                     |
