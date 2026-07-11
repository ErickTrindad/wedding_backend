import type { FastifyInstance } from "fastify";
import { FamilyController } from "../controllers/family.controller.js";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";

const familyController = new FamilyController();

export async function familyRoutes(fastify: FastifyInstance) {
	fastify.get<{ Params: { id?: string } }>(
		"/",
		{ preHandler: [authenticate, isAdmin] },
		familyController.getFamilies,
	);
	fastify.get<{ Params: { familyId: string } }>(
		"/:familyId/guests",
		{ preHandler: [authenticate] },
		familyController.getFamilyGuests,
	);
	fastify.post<{
		Body: { name: string; guestNames: string[] };
	}>(
		"/",
		{ preHandler: [authenticate, isAdmin] },
		familyController.createFamily,
	);
	fastify.delete<{
		Params: { familyId: string };
	}>(
		"/:familyId",
		{ preHandler: [authenticate, isAdmin] },
		familyController.deleteFamily,
	);

	// Manipulação individual de "Slots" dentro da família
	fastify.post<{
		Params: { familyId: string };
		Body: { guestName: string };
	}>(
		"/:familyId/guests",
		{ preHandler: [authenticate, isAdmin] },
		familyController.addGuestSlot,
	);
	fastify.delete<{
		Params: { guestId: string };
	}>(
		"/guests/:guestId",
		{ preHandler: [authenticate, isAdmin] },
		familyController.removeGuestSlot,
	);
}
