import type { FastifyInstance } from "fastify";
import { RsvpController } from "../controllers/rsvp.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import type { RsvdUpdatePayload } from "../services/rsvp.service.js";

const rsvpController = new RsvpController();

export async function rsvpRoutes(fastify: FastifyInstance) {
	fastify.get("/", { preHandler: [authenticate] }, rsvpController.getGuests);

	fastify.put<{
		Body: { updates: RsvdUpdatePayload[] };
	}>("/confirm", { preHandler: [authenticate] }, rsvpController.updateGuests);
}
