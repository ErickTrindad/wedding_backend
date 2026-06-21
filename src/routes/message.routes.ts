import type { FastifyInstance } from "fastify";
import { MessageController } from "../controllers/message.controller.js";

const messageController = new MessageController();

export async function messageRoutes(fastify: FastifyInstance) {
	fastify.get("/", messageController.getMessages);
}
