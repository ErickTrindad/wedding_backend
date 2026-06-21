import type { FastifyReply, FastifyRequest } from "fastify";
import {
	type RsvdUpdatePayload,
	RsvpService,
} from "../services/rsvp.service.js";

const rsvpService = new RsvpService();

export class RsvpController {
	async getGuests(req: FastifyRequest, rep: FastifyReply) {
		const { familyId } = req.user;

		const guests = await rsvpService.getFamilyGuests(familyId);

		return rep.status(200).send({ guests });
	}

	async updateGuests(
		req: FastifyRequest<{ Body: { updates: RsvdUpdatePayload[] } }>,
		rep: FastifyReply,
	) {
		const { familyId } = req.user;
		const { updates } = req.body;

		if (!updates || !Array.isArray(updates)) {
			return rep.status(400).send({
				error: "Payload com formato inválido. Lista de atualizações esperado",
			});
		}

		await rsvpService.updateRsvp(familyId, updates);

		return rep.status(200).send({ message: "RSVP atualizado com sucesso" });
	}
}
