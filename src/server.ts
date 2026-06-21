import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import prisma from "./config/prisma.js";
import { adminAuthRoutes } from "./routes/admin.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { familyRoutes } from "./routes/family.routes.js";
import { feedRoutes } from "./routes/feed.routes.js";
import { giftRoutes } from "./routes/gift.routes.js";
import { messageRoutes } from "./routes/message.routes.js";
import { paymentRoutes } from "./routes/payment.routes.js";
import { rsvpRoutes } from "./routes/rsvp.routes.js";
import { whatsappRoutes } from "./routes/whatsapp.routes.js";
import { errorHandler } from "./utils/handleError.js";

const server = Fastify({
	trustProxy: true,
	logger: true,
});

async function main() {
	if (!process.env.JWT_ACCESS_TOKEN_SECRET) {
		throw new Error(
			"Variável de ambiente JWT_ACCESS_TOKEN_SECRET é obrigatória.",
		);
	}

	if (!process.env.COOKIE_SECRET) {
		throw new Error("Variável de ambiente COOKIE_SECRET é obrigatória.");
	}

	server.setErrorHandler(errorHandler);

	await server.register(cors, {
		origin:
			process.env.NODE_ENV === "production"
				? process.env.FRONTEND_URL
				: "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		allowedHeaders: [
			"Content-Type",
			"Accept",
			"Authorization",
			"Cache-Control",
			"Pragma",
		],
		credentials: true,
	});

	await server.register(fastifyJwt, {
		secret: process.env.JWT_ACCESS_TOKEN_SECRET,
		cookie: {
			cookieName: "token",
			signed: false,
		},
	});

	await server.register(fastifyCookie, {
		secret: process.env.COOKIE_SECRET,
	});

	await server.register(rateLimit, {
		global: true,
		max: 100,
		timeWindow: "15 minutes",
		errorResponseBuilder: (_, context) => {
			return {
				statusCode: 429,
				error: "Too Many Requests",
				message: `Opa! Você estourou o limite de requisições. Tente novamente em ${context.after}`,
			};
		},
	});

	await server.register(multipart, {
		limits: {
			fileSize: 30 * 1024 * 1024,
		},
	});

	server.get("/ping", async (_: FastifyRequest, rep: FastifyReply) => {
		prisma.$queryRaw`Select 1`;
		rep.send({ message: "pong" });
	});

	await server.register(authRoutes, { prefix: "/auth" });
	await server.register(rsvpRoutes, { prefix: "/rsvp" });
	await server.register(feedRoutes, { prefix: "/feed" });
	await server.register(paymentRoutes, { prefix: "/payments" });
	await server.register(giftRoutes, { prefix: "/gifts" });
	await server.register(familyRoutes, { prefix: "/admin/families" });
	await server.register(whatsappRoutes, { prefix: "/admin/whatsapp" });
	await server.register(dashboardRoutes, { prefix: "/admin/dashboard" });
	await server.register(messageRoutes, { prefix: "/messages" });
	await server.register(adminAuthRoutes, { prefix: "/admin/auth" });

	const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

	try {
		await server.listen({ port, host: "0.0.0.0" });
	} catch (error) {
		server.log.error(error);
		process.exit(1);
	}
}

main();
