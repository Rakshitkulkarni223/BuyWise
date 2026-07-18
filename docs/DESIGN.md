# 🛠️ Design & Developer Guide

## Project Structure

```
BuyWise/
├── backend/
│   ├── server.py               # FastAPI entry point (Uvicorn)
│   ├── requirements.txt        # Python dependencies
│   └── app/
│       ├── config.py           # Env vars, categories, suppliers, weight profiles, city/state mapping
│       ├── database.py         # Motor async MongoDB client
│       ├── auth.py             # JWT (PyJWT), bcrypt password hashing, auth dependency
│       ├── schemas.py          # Pydantic validation models (SearchInput, BasketInput, PreferenceInput)
│       ├── routes.py           # All API routes under /api prefix
│       ├── routes_supplier.py  # Supplier Hub CRUD routes
│       ├── schemas_supplier.py # Supplier Hub Pydantic models
│       ├── seed.py             # DB seeder (categories, suppliers, demo user, sample history)
│       └── services/
│           ├── core.py         # PRNG, CatalogResolver, MockProviderAdapter, Search, Recommendation
│           ├── basket.py       # Basket optimization (split-cart)
│           ├── analytics.py    # Dashboard, History, Preference, Catalog services
│           ├── intelligence.py # Procurement intelligence engine
│           ├── supplier_hub.py # Supplier Hub CRUD service
│           ├── supplier_hub_adapter.py  # Adapter for Supplier Hub as a provider
│           ├── supplier_hub_search.py   # Supplier Hub search with state-based filtering
│           ├── serpapi_adapter.py       # Live Google Shopping adapter via SerpAPI
│           └── llm_advisor.py          # Gemini-powered AI Procurement Advisor
│
├── frontend/
│   └── src/
│       ├── components/         # Reusable UI (AppLayout, Card, Badge, DateRangeFilter, BasketResults, etc.)
│       ├── context/            # AuthContext, ThemeContext, LocationContext
│       ├── hooks/              # useSearchSuggestions, useWatchlist
│       ├── lib/                # api client, formatters, exportUtils
│       ├── pages/              # Dashboard, Search, BusinessImpact, Analytics, History, Watchlist, Settings, Docs
│       └── types.ts            # Shared TypeScript interfaces
│
├── docs/                       # Architecture, API reference, design docs
├── screenshots/                # Product screenshots for README
└── README.md
```

---

## Design Decisions

- **Adapter Pattern** — Supplier integrations use an adapter interface so mock data can be swapped for real APIs without touching business logic. Supplier Hub uses the same adapter interface.
- **Service Layer** — All database access goes through service classes, keeping Motor queries out of routes.
- **Async concurrency** — Individual supplier failures don't block the entire search (`asyncio.gather` with error handling).
- **Fire-and-forget history** — Search and basket history persisted asynchronously. Basket optimizations count as a single search entry in the dashboard.
- **Location-aware filtering** — Supplier Hub suppliers are filtered by the user's state. Delivery days estimated from city/state distance.
- **Date range filtering** — Dashboard, Analytics, and Business Impact endpoints accept optional `from`/`to` query params.
- **Business impact metrics** — Derived from search history: hours saved (manual 45 min vs AI 3 min), efficiency score (composite of accuracy + automation + volume), projected annual savings.
- **Weight profiles** — The recommendation engine is fully configurable via weight profiles and 6 recommendation modes.

---

## Conventions

- **Backend**: FastAPI routes → Service layer → MongoDB (Motor). All functions wrapped in try-catch. Responses use `{"success": true, "data": ...}`.
- **Frontend**: Functional components with hooks. State collocated in page components. `api.ts` centralizes all HTTP calls. TailwindCSS utility classes for styling.
- **Error handling**: All functions wrapped in try-catch blocks. Backend raises `HTTPException`. Frontend uses `apiError()` helper.
- **Validation**: Pydantic models for backend request validation. TypeScript interfaces on the frontend.

---

## Data Model (MongoDB Collections)

| Collection | Description | Key Fields |
|------------|-------------|------------|
| `users` | Accounts, hashed credentials | name, email, password, role, businessType |
| `categories` | Product categories (seeded) | name, label, icon, suppliers[] |
| `suppliers` | Marketplace supplier definitions (seeded) | name, label, category, city, state |
| `searchhistories` | Single search results + recommendations | userId, query, category, results[], recommendation, createdAt |
| `baskethistories` | Basket optimizations with item assignments | userId, category, items[], splitTotal, baseline, createdAt |
| `userpreferences` | Per-user settings and weight profiles | userId, defaultCategory, defaultSort, weightProfile, city, weights |

---

## Running Tests

```bash
cd backend
python -m pytest tests/backend_test.py -v
```

### Test Coverage

- Authentication (register, login, protected routes)
- Single product search with various categories
- Basket optimization (valid, empty, gibberish items)
- Basket & unified history (CRUD, pagination)
- Preferences (get, update)
- Analytics endpoint
