import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { GET, POST } from "@/app/api/projects/route";

describe("API /api/projects", () => {
  beforeEach(async () => {
    await prisma.project.deleteMany();
  });

  it("GET deve retornar 200", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("POST inválido deve retornar 400", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST válido deve retornar 201", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Projeto Atlas Test",
        description: "Teste automatizado",
        status: "active",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.name).toBe("Projeto Atlas Test");
  });
});