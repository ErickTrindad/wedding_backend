import prisma from "../config/prisma.js";

export class DashboardService {
	async getMetrics() {
		const [contributionsSum, guestsStats, recentContributions, giftStats] =
			await Promise.all([
				prisma.contribution.aggregate({
					_sum: { amount: true },
					where: { status: "APPROVED" },
				}),

				prisma.guest.groupBy({
					by: ["isConfirmed"],
					_count: { isConfirmed: true },
				}),

				prisma.contribution.findMany({
					where: { status: "APPROVED" },
					orderBy: { createdAt: "desc" },
					take: 10,
					select: {
						id: true,
						amount: true,
						donorName: true,
						createdAt: true,
						gift: {
							select: { title: true },
						},
					},
				}),

				prisma.gift.count(),
			]);

		let confirmedCount = 0;
		let declinedCount = 0;
		let pendingCount = 0;

		const totalGuestsCount = await prisma.guest.count();

		for (const stat of guestsStats) {
			if (stat.isConfirmed === true) confirmedCount = stat._count.isConfirmed;
			if (stat.isConfirmed === false) declinedCount = stat._count.isConfirmed;
		}

		pendingCount = totalGuestsCount - (confirmedCount + declinedCount);

		return {
			financial: {
				totalRaised: contributionsSum._sum.amount || 0,
			},
			rsvp: {
				total: totalGuestsCount,
				confirmed: confirmedCount,
				declined: declinedCount,
				pending: pendingCount,
			},
			gifts: {
				totalItems: giftStats,
			},
			recentActivity: recentContributions,
		};
	}
}
