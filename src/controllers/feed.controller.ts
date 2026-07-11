import type { FastifyReply, FastifyRequest } from "fastify";
import { FeedService } from "../services/feed.service.js";
import { uploadToR2 } from "../utils/r2.util.js";

const feedService = new FeedService();

export class FeedController {
	async uploadImage(req: FastifyRequest, rep: FastifyReply) {
		const data = await req.file();

		if (!data) {
			return rep.status(400).send({ error: "Arquivo não importado" });
		}

		const buffer = await data.toBuffer();
		const imageUrl = await uploadToR2(
			buffer,
			data.mimetype,
			data.filename,
			"Feed",
		);

		return rep.status(200).send({ url: imageUrl });
	}

	async createPost(
		req: FastifyRequest<{
			Body: { text?: string; images: string[]; anonymousName?: string };
		}>,
		rep: FastifyReply,
	) {
		const { images, text, anonymousName } = req.body;
		const { guestId, name: jwtName, isAnonymous } = req.user;

		if (!text && (!images || images.length === 0)) {
			return rep
				.status(400)
				.send({ error: "Post deve ter texto ou pelo menos uma imagem" });
		}
		if (images.length > 3) {
			return rep.status(400).send({ error: "Máximo de fotos: 3" });
		}

		const authorName = isAnonymous ? anonymousName : jwtName;
		if (!authorName) {
			return rep
				.status(400)
				.send({ error: "authorName é obrigatório para usuário anônimo" });
		}

		const post = await feedService.createPost(
			isAnonymous ? null : guestId,
			authorName,
			text,
			images,
		);

		return rep.status(201).send({ post });
	}

	async getFeed(
		req: FastifyRequest<{ Querystring: { page?: string } }>,
		rep: FastifyReply,
	) {
		const page = parseInt(req.query.page || "1", 10);
		const posts = await feedService.getPaginatedFeed(page, 10);

		return rep.status(200).send({ posts });
	}

	async reactToPost(
		req: FastifyRequest<{ Params: { id: string }; Body: { type: string } }>,
		rep: FastifyReply,
	) {
		const { id: postId } = req.params;
		const { type } = req.body;
		const { guestId, isAnonymous } = req.user;
		const authorIp = req.ip;

		const validEmojis = [
			"HEART",
			"HEART_EYES",
			"HAPPY_TEARS",
			"PARTY_FACE",
			"STAR_EYES",
		];
		if (!validEmojis.includes(type)) {
			return rep.status(400).send({ error: "Tipo de reação inválido" });
		}

		const result = await feedService.toggleLike(
			postId,
			isAnonymous ? null : guestId,
			authorIp,
			type,
		);
		return rep.status(200).send(result);
	}

	async commentOnPost(
		req: FastifyRequest<{
			Params: { id: string };
			Body: { text: string; anonymousName?: string };
		}>,
		reply: FastifyReply,
	) {
		const { id: postId } = req.params;
		const { text, anonymousName } = req.body;
		const { guestId, name: jwtName, isAnonymous } = req.user;

		if (!text || text.trim() === "") {
			return reply
				.status(400)
				.send({ error: "Texto do comentário não pode ser nulo" });
		}

		const authorName = isAnonymous ? anonymousName : jwtName;
		if (!authorName) {
			return reply.status(400).send({ error: "Nome de author é obrigatório" });
		}

		const comment = await feedService.addComment(
			postId,
			isAnonymous ? null : guestId,
			authorName,
			text,
		);
		return reply.status(201).send({ comment });
	}

	async deletePost(
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		const { id: postId } = req.params;
		const { guestId, isAdmin, isAnonymous } = req.user;

		if (isAnonymous && !isAdmin) {
			throw new Error("Usuários anônimos não podem excluir publicações");
		}

		await feedService.deletePost(postId, guestId, isAdmin);
		return reply.status(200).send({ message: "Publicação excluída" });
	}

	async deleteComment(
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		const { id: commentId } = req.params;
		const { guestId, isAdmin, isAnonymous } = req.user;

		if (isAnonymous && !isAdmin) {
			throw new Error("Usuários anônimos não podem excluir comentários");
		}

		await feedService.deleteComment(commentId, guestId, isAdmin);
		return reply.status(200).send({ message: "Comentário excluído" });
	}
}
