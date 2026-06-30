import prisma from "../config/prisma.js";
import { AppError } from "../utils/appError.js";

export class AuthService {
	async verifyMagicLink(accessCode: string) {
		const family = await prisma.family.findUnique({
			where: { accessCode },
			include: {
				guests: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!family) {
			throw new AppError(404, "Código inválido");
		}

		return family;
	}

	async validateGuestSelection(familyId: string, guestId: string) {
		const guest = await prisma.guest.findUnique({
			where: { id: guestId, familyId },
		});

		if (!guest) {
			throw new AppError(404, "Convidado não encontrado ou sem autorização");
		}

		return guest;
	}
}
