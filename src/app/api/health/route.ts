import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(
    {
      status: "ok",
      service: "atlas",
      timestamp: new Date().toISOString(),
    },
    200
  );
}