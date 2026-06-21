import type { FastifyInstance } from "fastify";
import {
	type CheckoutBody,
	PaymentController,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const paymentController = new PaymentController();

export async function paymentRoutes(fastify: FastifyInstance) {
	// Protegida: O convidado precisa estar no site para gerar o pagamento
	fastify.post<{
		Body: CheckoutBody;
	}>("/checkout", { preHandler: [authenticate] }, paymentController.checkout);

	// Pública: Recebe o ping do Mercado Pago de forma assíncrona
	fastify.post("/webhook", paymentController.webhook);
}
