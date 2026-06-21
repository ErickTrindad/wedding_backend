import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { AppError } from "../utils/appError.js";

if (!process.env.SB_DATABASE_URL)
	throw new AppError(400, "SB_DATABASE_URL é obrigatório");

const pool = new pg.Pool({
	connectionString: process.env.SB_DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
	log: ["error", "warn"],
});

export default prisma;
