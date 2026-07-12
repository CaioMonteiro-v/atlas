import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } | Promise<{ id: string }> };

const UpdateUserSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(2).optional(),
    locale: z.string().min(2).optional(),
    timezone: z.string().min(2).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualizar",
  });

async function getId(params: Ctx["params"]) {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(_: Request, { params }: Ctx) {
  try {
    const id = await getId(params);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return fail("NOT_FOUND", "Usuário não encontrado", 404);
    }

    return ok(user, 200);
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const id = await getId(params);
    const body = await req.json();

    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return fail("BAD_REQUEST", "Dados inválidos", 400, parsed.error.flatten());
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
    });

    return ok(user, 200);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("NOT_FOUND", "Usuário não encontrado", 404);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("CONFLICT", "E-mail já cadastrado", 409);
    }

    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const id = await getId(params);

    await prisma.user.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("NOT_FOUND", "Usuário não encontrado", 404);
    }

    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}