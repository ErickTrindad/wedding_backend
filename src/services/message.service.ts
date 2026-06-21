import prisma from "../config/prisma.js";

export class MessageService {
	async getPublicMessages() {
		const messages = await prisma.contribution.findMany({
			where: {
				status: "APPROVED",
				message: {
					not: null,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				donorName: true,
				message: true,
				createdAt: true,
				gift: {
					select: {
						title: true,
					},
				},
			},
		});

		return messages.filter((m) => m.message && m.message.trim() !== "");
	}
}
