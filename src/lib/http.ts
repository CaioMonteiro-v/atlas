import { NextResponse } from "next/server";

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code: "BAD_REQUEST", message, details } },
    { status: 400 }
  );
}

export function notFound(message: string) {
  return NextResponse.json(
    { ok: false, error: { code: "NOT_FOUND", message } },
    { status: 404 }
  );
}

export function internalError(message = "Internal server error") {
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message } },
    { status: 500 }
  );
}