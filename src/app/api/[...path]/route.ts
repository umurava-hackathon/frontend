import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBackendBase() {
  const raw = process.env.BACKEND_INTERNAL_BASE_URL || "https://umurava-ai-backend.fly.dev";
  return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
  "cookie",
  "origin",
  "referer",
]);

const STRIP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
  "content-md5",
]);

type BackendResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
};

type ParsedCookie = {
  name: string;
  value: string;
  maxAge?: number;
  expires?: Date;
};

function getSetCookies(headers: http.IncomingHttpHeaders): string[] {
  const raw = headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseSetCookie(raw: string): ParsedCookie | null {
  const parts = raw.split(";").map((part) => part.trim()).filter(Boolean);
  const nameValue = parts[0];
  if (!nameValue) return null;

  const eq = nameValue.indexOf("=");
  if (eq <= 0) return null;

  const parsed: ParsedCookie = {
    name: nameValue.slice(0, eq).trim(),
    value: nameValue.slice(eq + 1).trim(),
  };

  for (const attr of parts.slice(1)) {
    const attrEq = attr.indexOf("=");
    const key = (attrEq === -1 ? attr : attr.slice(0, attrEq)).trim();
    const val = attrEq === -1 ? "" : attr.slice(attrEq + 1).trim();
    if (/^max-age$/i.test(key) && val) {
      const maxAge = Number(val);
      if (!Number.isNaN(maxAge)) parsed.maxAge = maxAge;
    }
    if (/^expires$/i.test(key) && val) {
      const expires = new Date(val);
      if (!Number.isNaN(expires.getTime())) parsed.expires = expires;
    }
  }

  return parsed;
}

function applyBackendCookies(response: NextResponse, headers: http.IncomingHttpHeaders) {
  for (const raw of getSetCookies(headers)) {
    const parsed = parseSetCookie(raw);
    if (!parsed?.name) continue;
    response.cookies.set({
      name: parsed.name,
      value: parsed.value,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      ...(parsed.maxAge !== undefined ? { maxAge: parsed.maxAge } : {}),
      ...(parsed.expires ? { expires: parsed.expires } : {}),
    });
  }
}

function outgoingHeaders(request: NextRequest, bodyLength: number): http.OutgoingHttpHeaders {
  const headers: http.OutgoingHttpHeaders = {};

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (refreshToken) {
    headers.cookie = `refreshToken=${refreshToken}`;
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.authorization = authorization;
  }

  if (bodyLength > 0) {
    headers["content-length"] = bodyLength;
  }

  return headers;
}

function proxyToBackend(
  target: string,
  method: string,
  headers: http.OutgoingHttpHeaders,
  body: Buffer
): Promise<BackendResponse> {
  const url = new URL(target);
  const lib = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 502,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );

    req.on("error", reject);
    if (body.length > 0) {
      req.write(body);
    }
    req.end();
  });
}

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path?.join("/") ?? "";
  const target = `${getBackendBase()}/api/${path}${request.nextUrl.search}`;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? Buffer.alloc(0)
      : Buffer.from(await request.arrayBuffer());

  let backendResponse: BackendResponse;
  try {
    backendResponse = await proxyToBackend(
      target,
      request.method,
      outgoingHeaders(request, body.length),
      body
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the API server. Please try again later.", code: "BAD_GATEWAY" },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(backendResponse.headers)) {
    if (!value || STRIP_RESPONSE_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === "set-cookie") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        responseHeaders.append(key, item);
      }
    } else {
      responseHeaders.set(key, value);
    }
  }

  const response = new NextResponse(request.method === "HEAD" ? null : new Uint8Array(backendResponse.body), {
    status: backendResponse.status,
    headers: responseHeaders,
  });
  response.headers.set("x-proxied-to", target);
  applyBackendCookies(response, backendResponse.headers);

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
