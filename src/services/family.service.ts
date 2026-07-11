import { randomBytes } from "crypto";
import prisma from "../config/prisma.js";

export class FamilyService {
	async createFamily(name: string, guestNames: string[]) {
		const accessCode = randomBytes(4).toString("hex");

		return await prisma.family.create({
			data: {
				name,
				accessCode,
				guests: {
					create: guestNames.map((name) => ({
						name,
						isSuggested: true,
					})),
				},
			},
			include: {
				guests: true,
			},
		});
	}

	async getFamilies(id?: string) {
		return await prisma.family.findMany({
			where: { id },
			include: {
				guests: true,
				_count: {
					select: { guests: true },
				},
			},
			orderBy: { name: "asc" },
		});
	}

	async getFamilyGuests(familyId: string) {
		return await prisma.guest.findMany({
			where: { familyId },
			orderBy: { name: "asc" },
		});
	}

	async addGuestSlot(familyId: string, guestName: string) {
		return await prisma.guest.create({
			data: {
				name: guestName,
				familyId,
				isSuggested: true,
			},
		});
	}

	async removeGuestSlot(guestId: string) {
		return await prisma.guest.delete({
			where: { id: guestId },
		});
	}

	async deleteFamily(familyId: string) {
		return await prisma.family.delete({
			where: { id: familyId },
		});
	}
}
