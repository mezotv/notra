import z from "zod";

export const organizationIdSchema = z.string().min(1);
