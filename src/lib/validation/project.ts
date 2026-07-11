import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2, "name must have at least 2 chars"),
  userId: z.string().min(1, "userId is required"),
});