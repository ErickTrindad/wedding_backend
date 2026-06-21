import type { FastifyReply, FastifyRequest } from "fastify";
import { PaymentService } from "../services/payment.service.js";

const paymentService = new PaymentService();

export interface MercadoPagoWebhookQuery {
	"data.id"?: string;
	type?: string;
	topic?: string;
	id?: string;
}

export interface MercadoPagoWebhookBody {
	action?: string;
	api_version?: string;
	data?: {
		id?: string;
	};
	date_created?: string;
	id?: number;
	live_mode?: boolean;
	type?: string;
	user_id?: string;
}

export interface CheckoutBody {
	giftId?: string;
	guestId?: string;
	donorName: string;
	message?: string;
	amount: number;
	paymentMethod: "PIX" | "CREDIT_CARD";
	payerEmail?: string; // Obrigatório para Transparente
	payerDocument?: string; // Obrigatório para Transparente
	exactPaymentMethodId?: string;
	token?: string; // Token do cartão gerado no front-end pelo SDK do MP
	installments?: number;
	anonymousName?: string;
}

export class PaymentController {
	async checkout(
		req: FastifyRequest<{ Body: CheckoutBody }>,
		reply: FastifyReply,
	) {
		const {
			giftId,
			amount,
			paymentMethod,
			payerEmail,
			payerDocument,
			token,
			installments,
			message,
			anonymousName,
		} = req.body;
		const { guestId, name: jwtName, isAnonymous } = req.user;

		if (!amount || amount <= 0) {
			throw new Error("O valor da contribuição deve ser maior que zero");
		}

		if (!["PIX", "CREDIT_CARD", "DEBIT_CARD"].includes(paymentMethod)) {
			throw new Error("Método de pagamento inválido");
		}

		const donorName = isAnonymous ? anonymousName : jwtName;
		if (!donorName) {
			throw new Error("Nome do doador é obrigatório");
		}

		const result = await paymentService.createPayment({
			giftId,
			guestId: isAnonymous ? undefined : guestId,
			donorName,
			message,
			amount,
			paymentMethod,
			payerEmail,
			payerDocument,
			token,
			installments,
		});

		return reply.status(200).send(result);
	}

	async webhook(
		req: FastifyRequest<{
			Body: MercadoPagoWebhookBody;
			Querystring: MercadoPagoWebhookQuery;
		}>,
		reply: FastifyReply,
	) {
		console.log("body recebido", req.body);
		const paymentId =
			req.query["data.id"] || req.body?.data?.id || req.query.id;
		const type = req.query.type || req.body?.type || req.query.topic;

		if ((type === "payment" || type === "payment.created") && paymentId) {
			await paymentService.processWebhook(paymentId);
		}

		return reply.status(200).send({ received: true });
	}
}
