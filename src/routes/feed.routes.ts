import type { FastifyInstance } from "fastify";
import { FeedController } from "../controllers/feed.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const feedController = new FeedController();

export async function feedRoutes(fastify: FastifyInstance) {
	fastify.get<{
		Querystring: { page?: string };
	}>("/", { preHandler: [authenticate] }, feedController.getFeed);

	fastify.post(
		"/upload",
		{ preHandler: [authenticate] },
		feedController.uploadImage,
	);
	fastify.post<{
		Body: { text?: string; images: string[]; anonymousName?: string };
	}>("/post", { preHandler: [authenticate] }, feedController.createPost);

	fastify.post<{
		Params: { id: string };
		Body: { type: string };
	}>("/:id/like", { preHandler: [authenticate] }, feedController.reactToPost);
	fastify.post<{
		Params: { id: string };
		Body: { text: string; anonymousName?: string };
	}>(
		"/:id/comment",
		{ preHandler: [authenticate] },
		feedController.commentOnPost,
	);

	fastify.delete<{
		Params: { id: string };
	}>("/:id", { preHandler: [authenticate] }, feedController.deletePost);
	fastify.delete<{
		Params: { id: string };
	}>(
		"/comment/:id",
		{ preHandler: [authenticate] },
		feedController.deleteComment,
	);
}
