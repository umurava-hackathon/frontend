# Netlify setup for auth cookies

The browser always calls **same-origin** `https://ai-screen-ing.netlify.app/api/...`.
That is expected. `BACKEND_INTERNAL_BASE_URL` is **not** used in the browser.

Flow:

1. Browser → `POST https://ai-screen-ing.netlify.app/api/auth/refresh`
2. Netlify route handler → `POST https://umurava-ai-backend.fly.dev/api/auth/refresh`

Confirm the upstream target in DevTools → the refresh response header `x-proxied-to`.

## Required environment variables

In Netlify: Site configuration → Environment variables.

| Variable | Value | Scope |
|---|---|---|
| `BACKEND_INTERNAL_BASE_URL` | `https://umurava-ai-backend.fly.dev` | All deploy contexts |

**Do not set** `NEXT_PUBLIC_API_BASE`. If it points at Fly.dev, login cookies will be stored on the backend host and middleware on Netlify will send you back to `/login`.

After changing env vars, trigger a **new deploy**. Netlify does not apply env changes to an already-built site.
