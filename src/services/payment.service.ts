import axios from "axios";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";

const mpApi = axios.create({
	baseURL: "https://api.mercadopago.com",
	headers: {
		Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
	},
});

interface CheckoutPayload {
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
}

export class PaymentService {
	async createPayment(data: CheckoutPayload) {
		const contribution = await prisma.contribution.create({
			data: {
				giftId: data.giftId,
				guestId: data.guestId,
				donorName: data.donorName,
				message: data.message,
				amount: data.amount,
				paymentMethod: data.paymentMethod,
				payerEmail: data.payerEmail,
				payerDocument: data.payerDocument,
			},
		});

		let paymentResponse: { id: string; init_point: string };

		if (process.env.NODE_ENV !== "production") {
			const { data: prefData } = await mpApi.post("/checkout/preferences", {
				external_reference: contribution.id, // VÍNCULO AQUI
				items: [
					{
						title: data.giftId ? "Cota de presente" : "Doação livre",
						quantity: 1,
						unit_price: data.amount,
					},
				],
				payment_methods: {
					excluded_payment_types: [{ id: "ticket" }],
				},
				back_urls: {
					success: `${process.env.FRONTEND_URL}/sucesso`,
					failure: `${process.env.FRONTEND_URL}/erro`,
				},
				auto_return: "approved",
				notification_url: `${process.env.BACKEND_URL}/payments/webhook`,
			});

			paymentResponse = {
				id: prefData.id,
				init_point: prefData.init_point,
			};
		} else {
			if (!data.payerEmail || !data.payerDocument) {
				throw new Error(
					"E-mail e documento são obrigatórios para pagamentos em produção",
				);
			}

			const payload = {
				transaction_amount: data.amount,
				description: data.giftId ? "Cota de Presente" : "Doação Livre",
				payment_method_id:
					data.paymentMethod === "PIX" ? "pix" : data.exactPaymentMethodId,
				token: data.paymentMethod === "CREDIT_CARD" ? data.token : undefined,
				installments: data.installments || 1,
				external_reference: contribution.id,
				payer: {
					email: data.payerEmail,
					identification: {
						type: "CPF",
						number: data.payerDocument.replace(/\D/g, ""),
					},
				},
			};

			const { data: payData } = await mpApi.post("/v1/payments", payload);
			paymentResponse = payData;
		}

		await prisma.contribution.update({
			where: { id: contribution.id },
			data: { paymentId: paymentResponse.id.toString() },
		});

		return {
			contributionId: contribution.id,
			paymentData: paymentResponse,
		};
	}

	async processWebhook(paymentId: string) {
		const { data: mpPayment } = await mpApi.get(`/v1/payments/${paymentId}`);

		if (mpPayment.status !== "approved") {
			return { status: "ignored", reason: "Pagamento não está aprovado" };
		}

		const myContributionId = mpPayment.external_reference;

		if (!myContributionId) {
			throw new AppError(
				500,
				"Pagamento no MP não possui external_reference vinculado.",
			);
		}

		await prisma.$transaction(async (tx) => {
			const contribution = await tx.contribution.findUnique({
				where: { id: myContributionId },
			});

			if (!contribution) {
				throw new Error("Contribuição não encontrada no sistema");
			}

			if (contribution.status === "APPROVED") {
				return;
			}

			// Atualiza o status da contribuição
			await tx.contribution.update({
				where: { id: contribution.id },
				data: { status: "APPROVED", paymentId },
			});

			// Se estiver vinculada a um presente, soma o valor arrecadado
			if (contribution.giftId) {
				await tx.gift.update({
					where: { id: contribution.giftId },
					data: {
						gatheredValue: { increment: contribution.amount },
					},
				});
			}
		});

		return { status: "processed" };
	}
}
