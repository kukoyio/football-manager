# Football Manager

A text-based football management simulation game built with Node.js and TypeScript. Manage your club through transfer windows, set tactics, and simulate matches across a full season.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **CLI**: (coming soon)

## Features

- [ ] Squad management — contracts, wages, player attributes
- [ ] Tactics & formation builder
- [ ] Transfer market — bids, negotiations, valuations
- [ ] Headless match simulation engine
- [ ] League & season progression
- [ ] Club finances

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/football-manager.git
cd football-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start the CLI
npm run dev
```

## Project Structure

```
src/
  db/          # Prisma schema and migrations
  models/      # TypeScript types and interfaces
  services/    # Business logic and simulation engine
  routes/      # API endpoints (future)
  cli/         # CLI commands
```

## Development Status

Currently in active development. Building the core data model and match simulation engine.