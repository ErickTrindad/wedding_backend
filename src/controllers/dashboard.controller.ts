import type { FastifyReply, FastifyRequest } from "fastify";
import { DashboardService } from "../services/dashboard.service.js";

const dashboardService = new DashboardService();

export class DashboardController {
	async getDashboardMetrics(_: FastifyRequest, reply: FastifyReply) {
		const metrics = await dashboardService.getMetrics();

		return reply.status(200).send(metrics);
	}
}
