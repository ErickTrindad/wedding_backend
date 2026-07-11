import type { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";

export interface ExternalLinkDto {
	name: string;
	link: string;
}

export interface CreateGiftDto {
	title: string;
	description?: string;
	imageUrl: string;
	totalValue: number;
	externalLinks?: ExternalLinkDto[];
}

export class GiftService {
	async createGift(data: CreateGiftDto) {
		return await prisma.gift.create({
			data: {
				...data,
				externalLinks: data.externalLinks
					? (data.externalLinks as unknown as Prisma.InputJsonValue)
					: undefined,
			},
		});
	}

	async getGifts() {
		return await prisma.gift.findMany({
			orderBy: { totalValue: "asc" },
		});
	}

	async updateGift(
		id: string,
		title: string,
		totalValue: number,
		description?: string,
	) {
		return await prisma.gift.update({
			where: { id },
			data: { title, totalValue, description },
		});
	}

	async deleteGift(id: string) {
		return await prisma.gift.delete({ where: { id } });
	}
}
