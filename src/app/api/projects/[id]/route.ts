import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } | Promise<{ id: string }> };

const UpdateProjectSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["active", "paused", "archived"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Envie ao menos um campo para atualizar",
  });

async function getId(params: Ctx["params"]) {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(_: Request, { params }: Ctx) {
  try {
    const id = await getId(params);

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Projeto não encontrado", 404);
    }

    return ok(project, 200);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const id = await getId(params);
    const body = await req.json();

    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return fail("BAD_REQUEST", "Dados inválidos", 400, parsed.error.flatten());
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
    });

    return ok(project, 200);
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("NOT_FOUND", "Projeto não encontrado", 404);
    }

    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const id = await getId(params);

    await prisma.project.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("NOT_FOUND", "Projeto não encontrado", 404);
    }

    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}