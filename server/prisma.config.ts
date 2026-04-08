import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Direct URL preferred for migrations (poolers can break migrate). Falls back to DATABASE_URL. */
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error("Set DIRECT_URL or DATABASE_URL for Prisma CLI");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
