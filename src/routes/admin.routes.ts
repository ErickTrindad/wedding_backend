import type { FastifyInstance } from "fastify";
import { AdminController } from "../controllers/admin.controller.js";

const adminController = new AdminController();

export async function adminAuthRoutes(fastify: FastifyInstance) {
	// POST /admin/auth/login
	fastify.post("/login", adminController.login);

	// POST /admin/auth/logout
	fastify.post("/logout", adminController.logout);
}
