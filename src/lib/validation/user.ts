import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "name must have at least 2 chars"),
  email: z.string().email("invalid email"),
});