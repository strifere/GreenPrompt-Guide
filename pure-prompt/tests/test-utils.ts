import { NextRequest } from "next/server";

export function createJsonRequest(
  path: string,
  body: unknown,
  init: Omit<RequestInit, "body"> = {}
): NextRequest {
  const headers = new Headers(init.headers);
  const method = init.method ?? "POST";

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(new URL(path, "http://localhost"), {
    ...init,
    method,
    body: JSON.stringify(body),
    headers,
  });
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}