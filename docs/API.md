# 📡 API Reference

All endpoints are prefixed with `/api`. Responses use `{ "success": true, "data": ... }`.  
Auth endpoints return JWT tokens. All other endpoints require `Authorization: Bearer <token>`.

---

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register a new user |
| POST | `/api/auth/login` | ✗ | Login, returns JWT token |
| GET | `/api/auth/me` | ✓ | Get current user profile |

---

## Search & Compare

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/search` | ✓ | Search products across all configured suppliers |
| GET | `/api/categories` | ✗ | List all product categories |
| GET | `/api/suppliers/:category` | ✓ | List suppliers for a category |
| GET | `/api/weight-profiles` | ✗ | Available weight profiles |
| GET | `/api/recommendation-modes` | ✗ | Available recommendation modes |
| GET | `/api/cities` | ✗ | Available delivery cities |

---

## Basket Optimization

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/basket/optimize` | ✓ | Optimize a multi-item basket |
| GET | `/api/basket/history?page=1&limit=20` | ✓ | Paginated basket optimization history |

---

## Supplier Hub

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/suppliers` | ✓ | List all your suppliers |
| POST | `/api/suppliers` | ✓ | Add a new supplier |
| GET | `/api/suppliers/:id` | ✓ | Get supplier details |
| PUT | `/api/suppliers/:id` | ✓ | Update a supplier |
| DELETE | `/api/suppliers/:id` | ✓ | Remove a supplier |
| GET | `/api/suppliers/:id/products` | ✓ | List products for a supplier |
| POST | `/api/suppliers/:id/products` | ✓ | Add a product to a supplier |
| PUT | `/api/suppliers/:id/products/:pid` | ✓ | Update a product |
| DELETE | `/api/suppliers/:id/products/:pid` | ✓ | Remove a product |

---

## History & Preferences

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history?page=1&limit=20` | ✓ | Paginated search history |
| DELETE | `/api/history/:id` | ✓ | Delete a history entry |
| GET | `/api/preferences` | ✓ | Get user preferences (includes city) |
| PUT | `/api/preferences` | ✓ | Update user preferences (city, category, weight profile) |

---

## Dashboard, Analytics & Business Impact

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard?from=&to=` | ✓ | Dashboard KPIs (date range optional) |
| GET | `/api/analytics/spend?from=&to=` | ✓ | Spend analytics |
| GET | `/api/analytics/savings?from=&to=` | ✓ | Savings trend |
| GET | `/api/insights?from=&to=` | ✓ | AI-generated procurement insights |
| GET | `/api/business-impact?from=&to=` | ✓ | Business impact metrics (savings, hours saved, efficiency, ROI) |

---

## Authentication Details

```
// Include in every request:
Authorization: Bearer <token>

// Token payload:
{ userId, email, role, iat, exp }
```

- **Hashing**: bcrypt (12 salt rounds)
- **Token**: HS256 via PyJWT, configurable expiry
- **CORS**: Per environment via FastAPI CORSMiddleware
