import type { FastifyReply, FastifyRequest } from "fastify";
import { MessageService } from "../services/message.service.js";

const messageService = new MessageService();

export class MessageController {
	async getMessages(_: FastifyRequest, reply: FastifyReply) {
		const messages = await messageService.getPublicMessages();

		return reply.status(200).send({ messages });
	}
}
