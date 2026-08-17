import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_BASE = process.env.BACKEND_INTERNAL_BASE_URL || "http://51.102.152.208:8080";

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

function rewriteSetCookie(cookie: string): string {
  const parts = cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^domain=/i.test(part));

  if (!parts.some((part) => /^path=/i.test(part))) {
    parts.push("Path=/");
  }

  return parts.join("; ");
}

function getSetCookies(headers: http.IncomingHttpHeaders): string[] {
  const raw = headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function outgoingHeaders(request: NextRequest, bodyLength: number): http.OutgoingHttpHeaders {
  const headers: http.OutgoingHttpHeaders = {};

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.cookie = cookie;
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
  const target = `${BACKEND_BASE}/api/${path}${request.nextUrl.search}`;
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

  for (const cookie of getSetCookies(backendResponse.headers)) {
    response.headers.append("set-cookie", rewriteSetCookie(cookie));
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
