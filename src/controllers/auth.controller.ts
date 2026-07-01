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

	async anonymousLogin(
		req: FastifyRequest<{ Body: { name: string } }>,
		rep: FastifyReply,
	) {
		const { name } = req.body;
		const guestName = name?.trim();

		const tokenPayload = {
			familyId: "anonymous",
			guestId: "anonymous",
			name: guestName,
			isAnonymous: true,
			isAdmin: false,
		};

		const token = await rep.jwtSign(tokenPayload);

		rep.setCookie("token", token, {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 60 * 60 * 24 * 365,
		});

		return rep.status(200).send({
			success: true,
			user: { name: guestName, isAnonymous: true, isAdmin: false },
		});
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

		return rep.status(200).send({
			success: true,
			message: `Bem-vindo(a), ${guest.name}`,
			user: {
				familyId,
				guestId,
				name: guest.name,
				isAnonymous: false,
				isAdmin: guest.isAdmin,
			},
			token,
		});
	}

	async me(req: FastifyRequest, rep: FastifyReply) {
		try {
			await req.jwtVerify();

			return rep.status(200).send({
				success: true,
				user: {
					familyId: req.user.familyId,
					guestId: req.user.guestId,
					name: req.user.name,
					isAnonymous: req.user.isAnonymous,
					isAdmin: req.user.isAdmin,
				},
			});
		} catch {
			rep.clearCookie("token", { path: "/" });

			return rep.status(401).send({
				success: false,
				error: "Sessão inválida ou expirada",
			});
		}
	}

	async logout(_: FastifyRequest, rep: FastifyReply) {
		rep.clearCookie("token", { path: "/" });
		return rep.status(200).send({ success: true, message: "Logged out" });
	}
}
