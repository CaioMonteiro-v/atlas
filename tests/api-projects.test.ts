import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { GET as GET_PROJECTS, POST as POST_PROJECTS } from "@/app/api/projects/route";
import { GET as GET_PROJECT_BY_ID } from "@/app/api/projects/[id]/route";

type ProjectByIdContext = Parameters<typeof GET_PROJECT_BY_ID>[1];

const projectByIdContext = (id: string): ProjectByIdContext =>
  ({ params: { id } } as unknown as ProjectByIdContext);

describe("API /api/projects", () => {
  beforeEach(async () => {
    await prisma.project.deleteMany();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET should return 200", async () => {
    const res = await GET_PROJECTS();
    expect(res.status).toBe(200);
  });

  it("POST invalid payload should return 400", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a" }),
    });

    const res = await POST_PROJECTS(req);
    expect(res.status).toBe(400);
  });

  it("POST valid payload should return 201", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Atlas Project Test",
        description: "Automated test",
        status: "active",
      }),
    });

    const res = await POST_PROJECTS(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.name).toBe("Atlas Project Test");
  });
});

describe("API /api/projects/[id]", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET with missing id should return 404", async () => {
    const res = await GET_PROJECT_BY_ID(
      new Request("http://localhost/api/projects/missing-id"),
      projectByIdContext("missing-id")
    );

    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("GET internal error should return 500", async () => {
    vi.spyOn(prisma.project, "findUnique").mockRejectedValueOnce(new Error("boom"));

    const res = await GET_PROJECT_BY_ID(
      new Request("http://localhost/api/projects/any-id"),
      projectByIdContext("any-id")
    );

    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});