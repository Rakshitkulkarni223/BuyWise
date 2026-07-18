# Test Credentials — BuyWise

## Demo Account
- Email: demo@buywise.com
- Password: Demo@123

## Auth
- Tokens are JWT (Bearer). Login returns { token, user }. Send `Authorization: Bearer <token>`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Python FastAPI on port 8002.
- All API routes are prefixed with /api.
- The demo account is seeded with ~14 sample searches so the dashboard/analytics are populated.
