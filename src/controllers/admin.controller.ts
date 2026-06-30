import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/appError.js";

export class AdminController {
	async login(
		req: FastifyRequest<{ Body: { password: string } }>,
		reply: FastifyReply,
	) {
		const { password } = req.body;

		if (!password) {
			throw new Error("A senha é obrigatória");
		}

		const adminPassword = process.env.ADMIN_PASSWORD;

		if (!adminPassword) {
			throw new AppError(
				500,
				"Configuração de servidor ausente: ADMIN_PASSWORD não definida",
			);
		}

		if (password !== adminPassword) {
			return reply.status(401).send({ error: "Senha incorreta" });
		}

		const tokenPayload = {
			familyId: "admin",
			guestId: "admin",
			name: "Noivos",
			isAnonymous: false,
			isAdmin: true,
		};

		const token = await reply.jwtSign(tokenPayload);

		reply.setCookie("token", token, {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365,
		});

		return reply.status(200).send({
			success: true,
			message: "Bem-vindos ao painel de controle!",
		});
	}

	// O logout é o mesmo para todos, mas podemos ter uma rota explícita aqui se preferir organizar
	async logout(_: FastifyRequest, reply: FastifyReply) {
		reply.clearCookie("token", { path: "/" });
		return reply
			.status(200)
			.send({ success: true, message: "Sessão encerrada" });
	}
}
