import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  locale: z.string().default("pt-BR"),
  timezone: z.string().default("America/Sao_Paulo"),
});

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateUserSchema.parse(body);

    const user = await prisma.user.create({ data: parsed });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}