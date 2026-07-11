import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { GET, POST } from "@/app/api/users/route";

describe("API /api/users", () => {
  beforeEach(async () => {
    // limpa antes de cada teste
    await prisma.user.deleteMany();
  });

  it("GET deve retornar 200", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("POST inválido deve retornar 400", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a", email: "email-invalido" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST válido deve retornar 201", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Caio",
        email: "caio+test@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.email).toBe("caio+test@atlas.dev");
  });
});