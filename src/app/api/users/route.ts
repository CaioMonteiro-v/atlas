import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api-response";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  locale: z.string().default("pt-BR"),
  timezone: z.string().default("America/Sao_Paulo"),
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok(users, 200);
  } catch {
    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return fail("BAD_REQUEST", "Dados inválidos", 400, parsed.error.flatten());
    }

    const user = await prisma.user.create({ data: parsed.data });
    return ok(user, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("CONFLICT", "E-mail já cadastrado", 409);
    }

    return fail("INTERNAL_ERROR", "Erro interno", 500);
  }
}