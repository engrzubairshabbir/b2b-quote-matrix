import { PrismaClient } from "@prisma/client";

let prisma;

// In production, instantiate directly. In development, reuse global instance to avoid connection exhaustion during HMR.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  prisma = global.__db;
}

export default prisma;
