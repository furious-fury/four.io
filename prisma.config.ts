import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Migrations need a real URL; `prisma generate` only needs a syntactically valid placeholder. */
const url =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
