import type { FastifyReply, FastifyRequest } from "fastify";
import { FamilyService } from "../services/family.service.js";

const familyService = new FamilyService();

export class FamilyController {
	async createFamily(
		req: FastifyRequest<{ Body: { name: string; guestNames: string[] } }>,
		rep: FastifyReply,
	) {
		const { name, guestNames } = req.body;

		if (!name || typeof name !== "string") {
			throw new Error("O nome da família é obrigatório");
		}

		if (!guestNames || !Array.isArray(guestNames) || guestNames.length === 0) {
			throw new Error(
				"Você deve adicionar pelo menos um convidado para criar uma família",
			);
		}

		const validNames = guestNames.filter((name) => name.trim().length > 0);
		if (validNames.length !== guestNames.length) {
			throw new Error("Todos os convidados devem ter um nome válido");
		}

		const family = await familyService.createFamily(name, validNames);
		return rep.status(201).send({ family });
	}

	async getFamilies(_: FastifyRequest, rep: FastifyReply) {
		const families = await familyService.getFamilies();
		return rep.status(200).send({ families });
	}

	async addGuestSlot(
		req: FastifyRequest<{
			Params: { familyId: string };
			Body: { guestName: string };
		}>,
		rep: FastifyReply,
	) {
		const { familyId } = req.params;
		const { guestName } = req.body;

		if (!guestName || typeof guestName !== "string") {
			throw new Error("O nome do convidado é obrigatório");
		}

		const guest = await familyService.addGuestSlot(familyId, guestName);
		return rep.status(201).send({ guest });
	}

	async removeGuestSlot(
		req: FastifyRequest<{ Params: { guestId: string } }>,
		rep: FastifyReply,
	) {
		const { guestId } = req.params;

		await familyService.removeGuestSlot(guestId);
		return rep.status(200).send({ message: "Convidado removido com sucesso" });
	}

	async deleteFamily(
		req: FastifyRequest<{ Params: { familyId: string } }>,
		rep: FastifyReply,
	) {
		const { familyId } = req.params;

		await familyService.deleteFamily(familyId);
		return rep.status(200).send({ message: "Família excluída com sucesso" });
	}
}
