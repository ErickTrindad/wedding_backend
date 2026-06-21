import type { FastifyInstance } from "fastify";
import { GiftController } from "../controllers/gift.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import type { CreateGiftDto } from "../services/gift.service.js";

const giftController = new GiftController();

export async function giftRoutes(fastify: FastifyInstance) {
	fastify.get("/", { preHandler: [authenticate] }, giftController.getGifts);

	// Rotas restritas aos administradores (Noivos) via Controller
	fastify.post<{
		Body: CreateGiftDto;
	}>("/", { preHandler: [authenticate] }, giftController.createGift);
	fastify.put<{
		Params: { id: string };
		Body: { title: string; totalValue: number; description?: string };
	}>("/:id", { preHandler: [authenticate] }, giftController.updateGift);
	fastify.delete<{
		Params: { id: string };
	}>("/:id", { preHandler: [authenticate] }, giftController.deleteGift);
}
