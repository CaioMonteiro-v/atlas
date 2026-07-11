import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

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

    return NextResponse.json({ ok: true, data: users }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Dados inválidos",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({ data: parsed.data });

    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (error) {
    // Exemplo útil: e-mail único duplicado
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CONFLICT",
            message: "E-mail já cadastrado",
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
      { status: 500 }
    );
  }
}