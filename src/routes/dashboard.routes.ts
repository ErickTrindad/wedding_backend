import type { FastifyInstance } from "fastify";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";

const dashboardController = new DashboardController();

export async function dashboardRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/metrics",
		{ preHandler: [authenticate, isAdmin] },
		dashboardController.getDashboardMetrics,
	);
}
