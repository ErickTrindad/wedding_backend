import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";

export interface RsvdUpdatePayload {
	id: string;
	name: string;
	isConfirmed: boolean;
}

export class RsvpService {
	async getFamilyGuests(familyId: string) {
		return await prisma.guest.findMany({
			where: { familyId },
			select: {
				id: true,
				name: true,
				isSuggested: true,
				isConfirmed: true,
			},
		});
	}

	async updateRsvp(familyId: string, updates: RsvdUpdatePayload[]) {
		const familyGuests = await prisma.guest.findMany({
			where: { familyId },
			select: { id: true },
		});
		const validGuestsId = familyGuests.map((g) => g.id);

		const updatePromises = updates.map((update) => {
			if (!validGuestsId.includes(update.id)) {
				throw new AppError(
					400,
					`Guest ID ${update.id} não pertence à essa família`,
				);
			}

			return prisma.guest.update({
				where: { id: update.id },
				data: {
					name: update.name,
					isConfirmed: update.isConfirmed,
					isSuggested: false,
				},
			});
		});

		await prisma.$transaction(updatePromises);

		return { sucess: true };
	}
}
