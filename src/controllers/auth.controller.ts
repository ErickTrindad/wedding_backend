import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service.js";

const authService = new AuthService();

export class AuthController {
	async getFamilyByLink(
		req: FastifyRequest<{ Querystring: { code: string } }>,
		rep: FastifyReply,
	) {
		const { code } = req.query;

		if (!code)
			return rep.status(400).send({ error: "Access code é obrigatório" });

		const family = await authService.verifyMagicLink(code);

		return rep.status(200).send({ family });
	}

	async selectMember(
		req: FastifyRequest<{ Body: { familyId: string; guestId: string } }>,
		rep: FastifyReply,
	) {
		const { familyId, guestId } = req.body;

		if (!familyId || !guestId)
			return rep
				.status(400)
				.send({ error: "familyId e guestId são obrigatórios" });

		const guest = await authService.validateGuestSelection(familyId, guestId);

		const tokenPayload = {
			familyId: guest.familyId,
			guestId: guest.id,
			name: guest.name,
			isAnonymous: false,
		};

		const token = await rep.jwtSign(tokenPayload);

		rep.setCookie("token", token, {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365,
		});

		return rep.status(200).send({
			success: true,
			message: `Bem-vindo(a), ${guest.name}`,
			guestName: guest.name,
		});
	}

	async logout(_: FastifyRequest, rep: FastifyReply) {
		rep.clearCookie("token", { path: "/" });
		return rep.status(200).send({ success: true, message: "Logged out" });
	}
}
