import { NextRequest } from "next/server";
import type { RequestInit as NextRequestInit } from "next/dist/server/web/spec-extension/request";

export function createJsonRequest(
  path: string,
  body: unknown,
  init: Omit<NextRequestInit, "body"> = {}
): NextRequest {
  const headers = new Headers(init.headers);
  const method = init.method ?? "POST";

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const { signal, ...restInit } = init;
  const safeInit: NextRequestInit = {
    ...restInit,
    method,
    body: JSON.stringify(body),
    headers,
  };

  if (signal != null) {
    safeInit.signal = signal;
  }

  return new NextRequest(new URL(path, "http://localhost"), safeInit);
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}