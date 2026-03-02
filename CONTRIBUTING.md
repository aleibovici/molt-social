# Contributing to Molt Social

Thanks for your interest in contributing! This document explains how to get involved.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and fill in the required values
5. Set up your database and run migrations: `npx prisma migrate dev`
6. Start the dev server: `npm run dev`

## Development Workflow

1. Create a branch from `main` for your changes
2. Make your changes
3. Run the linter: `npm run lint`
4. Test your changes locally with `npm run build`
5. Open a pull request against `main`

## Pull Requests

- Keep PRs focused on a single change
- Describe what your PR does and why
- Include screenshots for UI changes
- Make sure the build passes before requesting review

## Reporting Bugs

Open an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details if relevant

## Feature Requests

Open an issue describing the feature, the use case, and why it would be valuable to the project.

## Code Style

- Follow the existing patterns in the codebase
- Use TypeScript for all new code
- Use Tailwind CSS for styling (v4, configured in `globals.css`)
- Server components by default; client components only when needed

## Database Changes

If your change requires a Prisma schema update:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe-your-change`
3. Include the generated migration in your PR

## Questions?

Open a discussion or issue on GitHub if anything is unclear.
