import prisma from "../config/prisma.js";

export class FeedService {
	async createPost(
		guestId: string | null,
		authorName: string,
		text?: string,
		images: string[] = [],
	) {
		if (guestId) {
			const lastPost = await prisma.post.findFirst({
				where: {
					guestId,
				},
				orderBy: {
					createdAt: "desc",
				},
				select: {
					createdAt: true,
				},
			});

			if (lastPost) {
				const now = new Date();
				const diffInMs = now.getTime() - lastPost.createdAt.getTime();
				const diffInMinutes = diffInMs / (1000 * 60);

				if (diffInMinutes < 15) {
					const remainingTime = Math.ceil(15 - diffInMinutes);
					throw new Error(
						`Limite atingido. Você só pode criar um post a cada 15 minutos. Tente novamente em ${remainingTime} minutos.`,
					);
				}
			}
		}

		return await prisma.post.create({
			data: {
				text,
				images,
				guestId,
				authorName,
			},
		});
	}

	async getPaginatedFeed(page: number, limit: number = 10) {
		const skip = (page - 1) * limit;

		return await prisma.post.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			include: {
				comments: {
					orderBy: { createdAt: "asc" },
					select: { id: true, authorName: true, text: true, createdAt: true },
				},
				likes: {
					select: { type: true, guestId: true },
				},
			},
		});
	}

	async toggleLike(
		postId: string,
		guestId: string | null,
		authorIp: string,
		type: string,
	) {
		const existingLike = await prisma.like.findFirst({
			where: guestId ? { postId, guestId } : { postId, authorIp },
		});

		if (existingLike?.type === type) {
			await prisma.like.delete({
				where: { id: existingLike.id },
			});
			return { action: "removed" };
		}

		if (existingLike) {
			await prisma.like.update({
				where: { id: existingLike.id },
				data: { type },
			});
			return { action: "updated" };
		}

		await prisma.like.create({
			data: {
				postId,
				guestId,
				authorIp,
				type,
			},
		});

		return { action: "added" };
	}

	async addComment(
		postId: string,
		guestId: string | null,
		authorName: string,
		text: string,
	) {
		return await prisma.comment.create({
			data: {
				postId,
				guestId,
				authorName,
				text,
			},
		});
	}

	async deletePost(postId: string, guestId: string, isAdmin: boolean) {
		const post = await prisma.post.findUnique({ where: { id: postId } });

		if (!post) throw new Error("Post não encontrado");

		if (!isAdmin && post.guestId !== guestId) {
			throw new Error("Você não tem permissão para excluir esta publicação");
		}

		await prisma.post.delete({ where: { id: postId } });
	}

	async deleteComment(commentId: string, guestId: string, isAdmin: boolean) {
		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) throw new Error("Comentário não encontrado");

		if (!isAdmin && comment.guestId !== guestId) {
			throw new Error("Você não tem permissão para excluir este comentário");
		}

		await prisma.comment.delete({ where: { id: commentId } });
	}
}
