# Test Credentials — ProcureAI

## Admin Account
- Email: admin@procureai.com
- Password: Admin@123
- Role: admin

## Test User Account
- Email: buyer@procureai.com
- Password: Buyer@123
- Role: user

## Auth
- Tokens are JWT (Bearer). Login returns { token, user }. Send `Authorization: Bearer <token>`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Node.js + Express + TypeScript on internal port 8002, fronted by a FastAPI proxy on 8001.
- All API routes are prefixed with /api.
- The admin account is seeded with ~9 sample searches so the dashboard/analytics are populated.
