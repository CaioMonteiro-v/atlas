import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok(projects, 200);
  } catch {
    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Dados inválidos", 400, parsed.error.flatten());
    }

    const project = await prisma.project.create({ data: parsed.data });
    return ok(project, 201);
  } catch {
    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}