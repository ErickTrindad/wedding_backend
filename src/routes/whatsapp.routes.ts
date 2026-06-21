import type { FastifyInstance } from "fastify";
import { WhatsAppController } from "../controllers/whatsapp.controller.js";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";

const whatsappController = new WhatsAppController();

export async function whatsappRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/init",
		{ preHandler: [authenticate, isAdmin] },
		whatsappController.init,
	);
	fastify.get(
		"/status",
		{ preHandler: [authenticate, isAdmin] },
		whatsappController.getStatus,
	);
	fastify.post(
		"/logout",
		{ preHandler: [authenticate, isAdmin] },
		whatsappController.logout,
	);
	fastify.post<{
		Body: { targets: { familyId: string; phone: string }[] };
	}>(
		"/send-invites",
		{ preHandler: [authenticate, isAdmin] },
		whatsappController.sendBulkInvites,
	);
}
