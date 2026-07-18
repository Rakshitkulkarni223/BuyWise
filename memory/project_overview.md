# BuyWise — Project Memory

## Purpose

BuyWise is a procurement decision-intelligence web app. It lets a business compare marketplace offers and its private/offline suppliers in one search, then recommends the best purchasing option for the selected procurement strategy.

## Architecture

- **Frontend:** React 18 + TypeScript SPA (Tailwind, React Router, Recharts, Framer Motion, Lucide) in `frontend/`.
- **Backend:** FastAPI / Pydantic / Uvicorn in `backend/`, with async MongoDB access via Motor.
- **Auth:** JWT bearer tokens with bcrypt password hashing.
- **External integrations (optional):** SerpAPI for Google Shopping and Gemini 2.0 Flash for natural-language recommendation explanations.
- The frontend communicates with the backend over JSON/HTTP; APIs are documented in `docs/API.md`.

## Core product capabilities

- Unified product search and normalized supplier ranking.
- A multi-factor recommendation engine using seven procurement factors and six modes: Balanced, Lowest Cost, Lowest Risk, Fastest Delivery, Highest Reliability, and Best Long-Term Value.
- Supplier Hub for private supplier and catalogue management.
- Split-cart/basket optimizer that can choose the cheapest supplier combination across multiple products.
- Explainable recommendations: confidence, scorecards/radar charts, and rule-based or Gemini-assisted reasoning.
- Location-aware delivery estimates (same city/state vs. out-of-state).
- Business Impact analytics, ROI calculator, CSV/PDF exports, watchlist, search history, and light/dark themes.

## Important locations

- `backend/server.py`: FastAPI entry point.
- `backend/app/routes.py` and `backend/app/routes_supplier.py`: API routes.
- `backend/app/services/`: recommendation, basket, analytics, supplier, marketplace, and LLM logic.
- `frontend/src/App.tsx`: SPA composition/routes.
- `frontend/src/pages/`: product areas (Dashboard, Search, Supplier Hub, Impact, Analytics, History, Watchlist, Settings, Docs, auth).
- `frontend/src/components/`: reusable comparison, recommendation, basket, and layout UI.
- `frontend/src/lib/api.ts` and `frontend/src/lib/supplierHubApi.ts`: client API layer.
- `backend/tests/`: backend test suites.
- `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, and `docs/API.md`: detailed reference material.

## Local setup and run (README)

- Prerequisites: Python 3.11+, Node 18+, MongoDB (local or Atlas).
- Backend: install `backend/requirements.txt`; run `uvicorn server:app --host 0.0.0.0 --port 8001 --reload` from `backend/`.
- Frontend: install dependencies in `frontend/`; run `npm start`.
- Configure `backend/.env` with MongoDB, JWT, CORS, and optional SerpAPI/Gemini credentials; configure `frontend/.env` with `REACT_APP_BACKEND_URL`.
- README test command: `python -m pytest tests/backend_test.py -v` from `backend/`.

## Working notes

- Preserve the adapter-based integration boundary: marketplace and Supplier Hub results feed a shared recommendation flow.
- Search execution is asynchronous and should isolate failures from an individual supplier.
- For API details and exact request/response contracts, read `docs/API.md` rather than rediscovering routes from source.
- Demo credentials are maintained separately in `memory/test_credentials.md`.
