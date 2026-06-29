"""
Reverse proxy (port 8001, supervisor-managed) -> Node/Express backend (port 8002).

The platform ingress routes every `/api/*` request to port 8001. The real application
is a Node.js + Express + TypeScript service running on port 8002 (managed by the
`node-backend` supervisor program). This thin FastAPI app forwards all traffic to it.
"""
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response

NODE_BACKEND_URL = os.environ.get("NODE_BACKEND_URL", "http://127.0.0.1:8002")

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
client = httpx.AsyncClient(base_url=NODE_BACKEND_URL, timeout=httpx.Timeout(90.0))

HOP_BY_HOP = {
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "te",
    "trailers",
    "upgrade",
    "proxy-authenticate",
    "proxy-authorization",
}


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request):
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    try:
        upstream = await client.request(
            request.method,
            "/" + path,
            params=dict(request.query_params),
            content=body,
            headers=headers,
        )
    except (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError):
        return Response(
            content=b'{"success":false,"error":"Backend service is starting, please retry."}',
            status_code=503,
            media_type="application/json",
        )

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
    )


@app.on_event("shutdown")
async def _shutdown():
    await client.aclose()
