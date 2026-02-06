---
name: railway-docs
description: Use when the user asks about Railway deployment, configuration, infrastructure, CLI commands, databases, networking, builds, or any Railway platform topic. Trigger phrases include "railway", "deploy to railway", "railway config", "railway CLI", "railway docs".
version: 1.0.0
allowed-tools: WebFetch, WebSearch, Read, Grep, Glob, Bash
---

# Railway Documentation Lookup

You are a Railway platform expert. When the user asks a question about Railway, fetch the relevant documentation page(s) from https://docs.railway.com and provide a clear, actionable answer.

## How to Use

The user's query is: $ARGUMENTS

## Documentation Map

Use this map to determine which page(s) to fetch based on the topic:

### Getting Started
| Topic | URL |
|-------|-----|
| Quick Start | https://docs.railway.com/overview/quick-start |
| The Basics | https://docs.railway.com/overview/the-basics |
| Best Practices | https://docs.railway.com/overview/best-practices |
| Advanced Concepts | https://docs.railway.com/overview/advanced-concepts |
| Production Readiness | https://docs.railway.com/overview/production-readiness-checklist |

### Build & Deploy
| Topic | URL |
|-------|-----|
| Services | https://docs.railway.com/develop/services |
| Environments | https://docs.railway.com/develop/environments |
| Variables | https://docs.railway.com/develop/variables |
| Cron Jobs | https://docs.railway.com/develop/cron-jobs |
| Functions | https://docs.railway.com/develop/functions |
| Config as Code | https://docs.railway.com/develop/config-as-code |
| Dockerfile Builds | https://docs.railway.com/builds/dockerfiles |
| Nixpacks | https://docs.railway.com/builds/nixpacks |
| Build Configuration | https://docs.railway.com/builds/build-configuration |
| GitHub Autodeploys | https://docs.railway.com/deployments/github-autodeploys |
| Healthchecks | https://docs.railway.com/deployments/healthchecks |
| Scaling | https://docs.railway.com/deployments/scaling |
| Regions | https://docs.railway.com/deployments/regions |
| Serverless | https://docs.railway.com/deployments/serverless |
| Troubleshooting | https://docs.railway.com/deployments/troubleshooting |

### Databases & Storage
| Topic | URL |
|-------|-----|
| PostgreSQL | https://docs.railway.com/databases/postgresql |
| MySQL | https://docs.railway.com/databases/mysql |
| Redis | https://docs.railway.com/databases/redis |
| MongoDB | https://docs.railway.com/databases/mongodb |
| Volumes | https://docs.railway.com/develop/volumes |
| Volume Backups | https://docs.railway.com/develop/volumes/backups |
| Storage Buckets | https://docs.railway.com/develop/storage-buckets |

### Networking
| Topic | URL |
|-------|-----|
| Public Networking | https://docs.railway.com/networking/public-networking |
| Private Networking | https://docs.railway.com/networking/private-networking |
| Domains | https://docs.railway.com/networking/domains |
| TCP Proxy | https://docs.railway.com/networking/tcp-proxy |
| Static Outbound IPs | https://docs.railway.com/networking/static-outbound-ips |

### CLI
| Topic | URL |
|-------|-----|
| CLI Overview | https://docs.railway.com/cli/overview |
| CLI Deploy | https://docs.railway.com/cli/deploy |
| CLI Logs | https://docs.railway.com/cli/logs |
| CLI Variables | https://docs.railway.com/cli/variable |
| CLI SSH | https://docs.railway.com/cli/ssh |

### Observability
| Topic | URL |
|-------|-----|
| Logs | https://docs.railway.com/observability/logs |
| Metrics | https://docs.railway.com/observability/metrics |
| Webhooks | https://docs.railway.com/observability/webhooks |

### Pricing
| Topic | URL |
|-------|-----|
| Plans | https://docs.railway.com/pricing/plans |
| Understanding Your Bill | https://docs.railway.com/pricing/understanding-your-bill |
| Cost Control | https://docs.railway.com/pricing/cost-control |

### Languages & Frameworks
| Topic | URL |
|-------|-----|
| Next.js | https://docs.railway.com/guides/nextjs |
| Express | https://docs.railway.com/guides/express |
| Django | https://docs.railway.com/guides/django |
| FastAPI | https://docs.railway.com/guides/fastapi |
| Flask | https://docs.railway.com/guides/flask |
| Rails | https://docs.railway.com/guides/rails |
| Go | https://docs.railway.com/guides/go |
| Rust | https://docs.railway.com/guides/rust |
| Laravel | https://docs.railway.com/guides/laravel |

### Integrations
| Topic | URL |
|-------|-----|
| GraphQL API | https://docs.railway.com/integrations/graphql-api |
| OAuth | https://docs.railway.com/integrations/oauth |

## Instructions

1. **Identify the topic** from the user's query ($ARGUMENTS).
2. **Fetch the relevant page(s)** from the documentation map above using WebFetch. If the topic doesn't clearly match a single page, fetch the 1-2 most relevant pages.
3. **If the topic isn't in the map**, use WebSearch to search `site:docs.railway.com <query>` to find the right page, then fetch it.
4. **Synthesize an answer** from the fetched documentation. Be specific and actionable.
5. **Include relevant configuration snippets**, CLI commands, or code examples from the docs.
6. **Link to the source page(s)** at the end of your answer so the user can read more.

## Project Context

This project (Nexus Social) is deployed on Railway with:
- **Framework**: Next.js 15 (App Router) with a Dockerfile build
- **Database**: PostgreSQL (via Prisma v7 with PrismaPg adapter)
- **Health endpoint**: `/api/health`
- Current Railway config: check `railway.toml` or `railway.json` if present

When answering, tailor advice to this stack where relevant.
