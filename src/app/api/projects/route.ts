import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: projects }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateProjectSchema.parse(body);

    const project = await prisma.project.create({ data: parsed });
    return NextResponse.json({ data: project }, { status: 201 });
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