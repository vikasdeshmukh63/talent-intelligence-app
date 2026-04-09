# eNlight Talent Intelligence

## Frontend setup

1. Install dependencies: `npm install`
2. Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

3. Start frontend: `npm run dev`

## Backend setup

1. Go to backend: `cd backend`
2. Install dependencies: `npm install`
3. Copy env file: `cp .env.example .env` (or create manually on Windows)
4. Update `DATABASE_URL` in `.env` for your PostgreSQL database
5. Configure AI + RAG in `.env`:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=talent_documents
```

6. Start backend: `npm run dev`

## Architecture

- Backend uses `Node.js + Express + Sequelize + PostgreSQL`
- Follows MVC structure (`controllers`, `models`, `routes`, `services`)
- Frontend sends requests only to your local backend API
