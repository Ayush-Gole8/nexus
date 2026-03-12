**Project**: NEXUS City Infrastructure Platform

**Overview**: This repository implements a city infrastructure platform (NEXUS) with a TypeScript/Node backend and a React + Vite frontend. Implementations completed so far are summarized below with links to the main code locations.

**Backend**
- **Entry point**: `backend/src/server.ts`: Express server, health check, route wiring, and DB connect. [backend/src/server.ts](backend/src/server.ts#L1-L50)
- **Database**: MongoDB via `mongoose`; connection logic in [backend/src/config/db.ts](backend/src/config/db.ts#L1-L20). Default URI: `MONGODB_URI` (env)
- **Auth**: JWT-based auth with registration/login routes and middleware. See [backend/src/routes/auth.ts](backend/src/routes/auth.ts#L1-L40) and [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts#L1-L60). User model at [backend/src/models/User.ts](backend/src/models/User.ts#L1-L120).
- **Infrastructure model & API**: CRUD for infrastructure nodes and dependency lookup. See model [backend/src/models/InfrastructureNode.ts](backend/src/models/InfrastructureNode.ts#L1-L120), dependency model [backend/src/models/Dependency.ts](backend/src/models/Dependency.ts#L1-L60), and routes [backend/src/routes/infrastructure.ts](backend/src/routes/infrastructure.ts#L1-L40).
- **Simulations/Scenarios**: Scenario model and endpoints to create/list/delete scenarios and to store simulation results. See [backend/src/models/Scenario.ts](backend/src/models/Scenario.ts#L1-L120) and [backend/src/routes/simulation.ts](backend/src/routes/simulation.ts#L1-L60).
- **Analysis & Graph engine**: Cascade analysis and critical-node ranking endpoints. See [backend/src/routes/analysis.ts](backend/src/routes/analysis.ts#L1-L40) and services [backend/src/services/cascadeEngine.ts](backend/src/services/cascadeEngine.ts) and [backend/src/services/graphService.ts](backend/src/services/graphService.ts).
- **AI integration**: AI analysis and chat endpoints using Gemini integration. Implementation in [backend/src/services/aiService.ts](backend/src/services/aiService.ts#L1-L200) and routes at [backend/src/routes/ai.ts](backend/src/routes/ai.ts#L1-L40). Env variable: `GEMINI_API_KEY` (optional).
- **Emergency response**: Endpoints and services for response calculations and predictive failures. See [backend/src/routes/emergency.ts](backend/src/routes/emergency.ts#L1-L40) and [backend/src/services/emergencyResponseService.ts](backend/src/services/emergencyResponseService.ts#L1-L200).
- **Scripts & deps**: Backend scripts in `backend/package.json` include `dev`, `build`, `start`, `seed`. See [backend/package.json](backend/package.json#L1-L40).

**Services (backend/src/services)**
- **aiService.ts**: Generates infrastructure context and queries Gemini for structured insights. [backend/src/services/aiService.ts](backend/src/services/aiService.ts#L1-L200)
- **cascadeEngine.ts**: Cascade/failure propagation engine (used by analysis routes). [backend/src/services/cascadeEngine.ts](backend/src/services/cascadeEngine.ts)
- **graphService.ts**: Graph-based utilities to compute centrality/critical nodes. [backend/src/services/graphService.ts](backend/src/services/graphService.ts)
- **simulationService.ts**: Runner utilities for scenario simulations. [backend/src/services/simulationService.ts](backend/src/services/simulationService.ts)
- **emergencyResponseService.ts**: Emergency routing/resilience calculations. [backend/src/services/emergencyResponseService.ts](backend/src/services/emergencyResponseService.ts)

**Frontend**
- **Framework**: React + Vite (TypeScript). See `frontend/package.json` for deps and scripts. [frontend/package.json](frontend/package.json#L1-L40)
- **Routing & Pages**: App routes implemented in [frontend/src/App.tsx](frontend/src/App.tsx#L1-L200). Implemented pages/components include:
  - `Dashboard`, `NetworkMap`, `CascadeAnalysis`, `ScenarioSimulator`, `AIInsights`, `InfrastructureManager`, `EmergencyResponse`, `CitizenDashboard`, `ResilienceHeatmap`, `PredictiveAnalytics`, `Login`, `Register` (referenced in App.tsx).
- **Map & Visualization**: Map and visualization stacks are included (maplibre/leaflet, three, react-three/fiber, recharts) — see `frontend/package.json` deps.
- **Auth client**: Protected routes and `useAuth` context used to gate pages; authentication integrates with backend JWT endpoints.

**Notable implemented flows**
- **User onboarding & auth**: Register and login flows with hashed passwords and JWT tokens (backend + frontend guarded routes).
- **Infrastructure management**: Create/list/fetch nodes and their dependencies; nodes include type, location, capacity, status, and criticality scoring.
- **Cascading failure analysis**: API to run cascade analysis on selected nodes and retrieve ranked critical nodes.
- **Scenario simulations**: Create scenarios, run simulations (service hooks), and store/delete results.
- **AI-assisted analysis**: Structured AI insights about infrastructure using `aiService` (requires Gemini key) and chat endpoint.
- **Emergency response & predictive analysis**: Endpoints to compute response times, zone resilience, and predictive failures.

**Environment variables**
- `MONGODB_URI` — MongoDB connection string (defaults to `mongodb://localhost:27017/nexus`)
- `JWT_SECRET` — secret for signing JWTs (change in production)
- `GEMINI_API_KEY` — (optional) Gemini API key for AI features

**How to run locally (quick)**
- Backend:

```bash
cd backend
npm install
npm run dev
```

- Frontend:

```bash
cd frontend
npm install
npm run dev
```

**Where to look for source**
- Backend entry & routes: [backend/src/server.ts](backend/src/server.ts#L1-L50)
- Backend models: [backend/src/models](backend/src/models)
- Backend services: [backend/src/services](backend/src/services)
- Frontend routes & pages: [frontend/src/App.tsx](frontend/src/App.tsx#L1-L200)

**Status / Completed vs Planned**
- Completed: Core backend APIs (auth, infrastructure CRUD, analysis, simulation, AI endpoints, emergency endpoints), service modules, MongoDB models, frontend routing and primary pages, visualization libs integrated.
- Remaining / next steps (suggested):
  - End-to-end integration tests and API documentation (Swagger/OpenAPI)
  - Seed data and sample scenarios for demos (`backend` has `seed` script)
  - CI/CD and deployment instructions
  - UI polishing, mobile responsiveness, and performance tuning for large graphs

**Notes**
- AI features depend on external API keys — if not configured, AI endpoints return a helpful message.
- Many services expect populated data (nodes & dependencies); use `npm run seed` in `backend` if available.

If you want, I can:
- run a quick inventory to produce a checklist of implemented endpoints and pages (file-by-file),
- generate a condensed API reference from the backend routes, or
- commit this README and open a PR.
