import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { GET as GET_USERS, POST as POST_USERS } from "@/app/api/users/route";
import { GET as GET_USER_BY_ID } from "@/app/api/users/[id]/route";
import {
  PATCH as PATCH_USER_BY_ID,
  DELETE as DELETE_USER_BY_ID,
} from "@/app/api/users/[id]/route";

type UserByIdContext = Parameters<typeof GET_USER_BY_ID>[1];

const userByIdContext = (id: string): UserByIdContext =>
  ({ params: { id } } as unknown as UserByIdContext);

describe("API /api/users", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET should return 200", async () => {
    const res = await GET_USERS();
    expect(res.status).toBe(200);
  });

  it("POST invalid payload should return 400", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a", email: "invalid-email" }),
    });

    const res = await POST_USERS(req);
    expect(res.status).toBe(400);
  });

  it("POST valid payload should return 201", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test.user@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      }),
    });

    const res = await POST_USERS(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.email).toBe("test.user@atlas.dev");
  });
});

describe("API /api/users/[id]", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET with missing id should return 404", async () => {
    const res = await GET_USER_BY_ID(
      new Request("http://localhost/api/users/missing-id"),
      userByIdContext("missing-id")
    );

    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("GET internal error should return 500", async () => {
    vi.spyOn(prisma.user, "findUnique").mockRejectedValueOnce(new Error("boom"));

    const res = await GET_USER_BY_ID(
      new Request("http://localhost/api/users/any-id"),
      userByIdContext("any-id")
    );

    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("API /api/users/[id] - PATCH/DELETE", () => {
  it("PATCH invalid payload should return 400", async () => {
    const user = await prisma.user.create({
      data: {
        name: "User One",
        email: "user.one@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      },
    });

    const req = new Request(`http://localhost/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // refine exige ao menos 1 campo
    });

    const res = await PATCH_USER_BY_ID(req, userByIdContext(user.id));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("PATCH with missing id should return 404", async () => {
    const req = new Request("http://localhost/api/users/missing-id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });

    const res = await PATCH_USER_BY_ID(req, userByIdContext("missing-id"));
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("PATCH duplicate email should return 409", async () => {
    const userA = await prisma.user.create({
      data: {
        name: "User A",
        email: "user.a@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      },
    });

    await prisma.user.create({
      data: {
        name: "User B",
        email: "user.b@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      },
    });

    const req = new Request(`http://localhost/api/users/${userA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user.b@atlas.dev" }),
    });

    const res = await PATCH_USER_BY_ID(req, userByIdContext(userA.id));
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("CONFLICT");
  });

  it("PATCH valid payload should return 200", async () => {
    const user = await prisma.user.create({
      data: {
        name: "User Patch",
        email: "user.patch@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      },
    });

    const req = new Request(`http://localhost/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User Patch Updated" }),
    });

    const res = await PATCH_USER_BY_ID(req, userByIdContext(user.id));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.name).toBe("User Patch Updated");
  });

  it("DELETE with missing id should return 404", async () => {
    const res = await DELETE_USER_BY_ID(
      new Request("http://localhost/api/users/missing-id", { method: "DELETE" }),
      userByIdContext("missing-id")
    );

    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("DELETE existing user should return 204", async () => {
    const user = await prisma.user.create({
      data: {
        name: "User Delete",
        email: "user.delete@atlas.dev",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
      },
    });

    const res = await DELETE_USER_BY_ID(
      new Request(`http://localhost/api/users/${user.id}`, { method: "DELETE" }),
      userByIdContext(user.id)
    );

    expect(res.status).toBe(204);
  });
});