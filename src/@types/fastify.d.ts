import "@fastify/jwt";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		user: {
			familyId: string;
			guestId: string;
			name: string;
			isAnonymous: boolean;
			isAdmin: boolean;
		};
	}
}
