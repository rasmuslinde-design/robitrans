import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(5175),
  ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_PATH: z.string().default("./data/robitrans.sqlite"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v: string | undefined) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  MAIL_FROM: z.string().default("RobiTrans <no-reply@robitrans.ee>"),
  MAIL_TO: z.string().default("bert-robert.polluste@voco.ee"),

  ADMIN_USER: z.string().default("admin"),
  ADMIN_PASS: z.string().default("qwerty123"),
  ADMIN_TOKEN: z.string().default("dev-admin-token-change-me"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(raw: Record<string, string | undefined>): Env {
  return EnvSchema.parse(raw);
}
