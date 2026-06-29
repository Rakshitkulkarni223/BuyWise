# ProcureAI — AI Procurement & Vendor Intelligence Platform

## Problem Statement
An AI-powered B2B platform where a business searches once and receives an intelligent, explainable
comparison of prices, discounts, delivery timelines, ratings and supplier availability across multiple
procurement sources — plus an explainable AI recommendation (best supplier + reasons + confidence +
estimated savings). Currency: Indian Rupees (₹). Phase 1 uses mock provider adapters (API-ready).

## User Choices (confirmed)
- Backend: **Node.js + Express + TypeScript** (not Python)
- AI recommendation: **pure deterministic weighted scoring** (formula in spec)
- AI insights: **rule-based / computed from history**
- Auth: **JWT custom (email + password)**
- Build priority: **core search→compare→recommend first**, then dashboard/analytics

## Architecture (IMPORTANT)
- Node/Express/TS API runs on internal **port 8002** (supervisor program `node-backend`, hot-reload via `tsx watch`).
- A FastAPI reverse-proxy on **port 8001** (`/app/backend/server.py`, supervisor `backend`) forwards ALL `/api/*` to Node 8002. Keeps platform ingress/health-checks happy.
- React + TypeScript (CRA) frontend on **port 3000** (supervisor `frontend`).
- MongoDB local. DB name `procureai`.
- Clean Architecture: Routes → Controllers → Services → Repositories → MongoDB.
- Patterns: Adapter (ProviderAdapter), Factory (ProviderFactory), Strategy (sortStrategies), Repository, Singleton (db).
- Swagger UI at `/api/docs`.

## Implemented (2026-06-28)
- **Auth**: register/login/me/logout, bcrypt hashing, JWT Bearer, idempotent admin+test-user seeding.
- **Catalog**: 8 categories, suppliers per category (data-driven), enable/disable toggle.
- **Search**: parallel provider search (Promise.allSettled), normalization, comparison (filter/sort/dedupe).
- **Recommendation engine**: weighted scoring (price/delivery/rating/discount/availability/warranty/return),
  normalized 0–1, configurable weight profiles (balanced/startup/hospital/restaurant), confidence from
  top-vs-runnerup gap, human-readable reasons, estimated savings, factor breakdown + scoreboard.
- **History**: persisted per search; list + delete.
- **Preferences**: default category, sort, weight profile, business type.
- **Dashboard/Analytics/Insights**: KPI widgets, monthly spend, category spend, supplier usage, savings trend,
  rule-based AI insight feed. Admin seeded with ~9 sample searches.
- **Frontend**: Login/Register (split-screen), sticky-sidebar app shell, Dashboard, Search & Compare (category
  picker + supplier toggles + query + weight-profile selector + AI recommendation card + comparison table),
  Analytics (recharts), History, Settings. Swiss/high-contrast design, Cabinet Grotesk + IBM Plex, ₹ formatting.

## Testing
- Iteration 1: Backend 21/21 pytest PASS, Frontend E2E all flows PASS. Report: `/app/test_reports/iteration_1.json`.
- All provider/product data is MOCK (deterministic) by Phase-1 design — no real marketplace APIs.

## Backlog / Next
- P1: Split-procurement (multi-product cart optimization) recommendations across suppliers.
- P1: Multi-product search results (group offers by product when query matches several catalog items).
- P2: Real provider adapters (Amazon/Flipkart/etc.) replacing MockProviderAdapter — no business-logic change.
- P2: Toasts, pagination for history, brand filter UI, supplier reliability score widget.
- P2: Org/multi-tenant, roles, approval workflows, purchase orders (future roadmap).
- P3: AI price-drop prediction, demand forecasting, duplicate-purchase detection.
