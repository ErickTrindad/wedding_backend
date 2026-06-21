import type { FastifyReply, FastifyRequest } from "fastify";
import { whatsappService } from "../services/whatsapp.service.js";

export class WhatsAppController {
	async init(_: FastifyRequest, reply: FastifyReply) {
		await whatsappService.startClient();
		return reply.status(200).send({ message: "Inicialização solicitada" });
	}

	async getStatus(_: FastifyRequest, reply: FastifyReply) {
		const statusData = whatsappService.getStatus();
		return reply.status(200).send(statusData);
	}

	async logout(_: FastifyRequest, reply: FastifyReply) {
		await whatsappService.logout();
		return reply.status(200).send({ message: "WhatsApp desconectado" });
	}

	async sendBulkInvites(
		req: FastifyRequest<{
			Body: { targets: { familyId: string; phone: string }[] };
		}>,
		reply: FastifyReply,
	) {
		const { targets } = req.body;

		if (!targets || !Array.isArray(targets) || targets.length === 0) {
			throw new Error(
				"Você deve fornecer a lista de destinatários com ID da família e número de telefone",
			);
		}

		const result = await whatsappService.sendInvites(targets);
		return reply.status(200).send(result);
	}
}
