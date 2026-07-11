import type { FastifyReply, FastifyRequest } from "fastify";
import {
	type CreateGiftDto,
	type ExternalLinkDto,
	GiftService,
} from "../services/gift.service.js";
import { uploadToR2 } from "../utils/r2.util.js";

const giftService = new GiftService();

export class GiftController {
	async createGift(
		req: FastifyRequest<{ Body: CreateGiftDto }>,
		rep: FastifyReply,
	) {
		const data = await req.file();
		if (!data)
			return rep
				.status(400)
				.send({ error: "Dados do formulário não enviados" });

		const titleField = data.fields.title as { value: string } | undefined;
		const valueField = data.fields.totalValue as { value: string } | undefined;
		const descField = data.fields.description as { value: string } | undefined;
		const linksField = data.fields.externalLinks as
			| { value: string }
			| undefined;

		if (!titleField || !valueField) {
			return rep.status(400).send({ error: "Título e valor são obrigatórios" });
		}

		const title = titleField.value;
		const totalValue = parseFloat(valueField.value);
		const description = descField?.value;

		let externalLinks: ExternalLinkDto[] | undefined;

		if (linksField?.value) {
			try {
				externalLinks = JSON.parse(linksField.value);
			} catch {
				return rep
					.status(400)
					.send({ error: "O campo externalLinks deve ser um JSON válido." });
			}
		}

		const buffer = await data.toBuffer();
		const imageUrl = await uploadToR2(
			buffer,
			data.mimetype,
			data.filename,
			"Gifts",
		);

		const gift = await giftService.createGift({
			title,
			totalValue,
			description,
			imageUrl,
			externalLinks,
		});

		return rep.status(201).send({ gift });
	}

	async getGifts(_: FastifyRequest, reply: FastifyReply) {
		const gifts = await giftService.getGifts();
		return reply.status(200).send(gifts);
	}

	async updateGift(
		req: FastifyRequest<{
			Params: { id: string };
			Body: { title: string; totalValue: number; description?: string };
		}>,
		reply: FastifyReply,
	) {
		const { isAdmin } = req.user;
		if (!isAdmin) throw new Error("Acesso negado");

		const { id } = req.params;
		const { title, totalValue, description } = req.body;

		const gift = await giftService.updateGift(
			id,
			title,
			totalValue,
			description,
		);
		return reply.status(200).send({ gift });
	}

	async deleteGift(
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		const { isAdmin } = req.user;
		if (!isAdmin) throw new Error("Acesso negado");

		await giftService.deleteGift(req.params.id);
		return reply.status(200).send({ message: "Presente excluído com sucesso" });
	}
}
