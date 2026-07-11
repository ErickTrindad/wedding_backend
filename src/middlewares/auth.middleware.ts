import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/appError.js";

export async function authenticate(req: FastifyRequest, rep: FastifyReply) {
	try {
		await req.jwtVerify();

		if (req.user.isAnonymous) {
			throw new AppError(403, "Acesso anônimo não permitido para essa rota");
		}
	} catch (err) {
		if (err instanceof AppError) {
			throw err;
		}
		req.log.error(`Falha na autenticação JWT: ${err}`);
		return rep
			.status(401)
			.send({ error: "Sem autorização ou sessão expirada" });
	}
}

export async function isAdmin(req: FastifyRequest, _: FastifyReply) {
	if (!req.user?.isAdmin) {
		throw new AppError(403, "Privilégios insuficientes");
	}
}
