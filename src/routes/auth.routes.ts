import type { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller.js";

const authController = new AuthController();

export async function authRoutes(fastify: FastifyInstance) {
	fastify.get("/magic-link", authController.getFamilyByLink);

	fastify.post("/select-member", authController.selectMember);
	fastify.post("/logout", authController.logout);
}
