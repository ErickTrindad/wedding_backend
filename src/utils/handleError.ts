import type { FastifyError, FastifyInstance } from "fastify";
import { AppError } from "./appError.js";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, req, rep) => {
	if (error instanceof AppError) {
		return rep.status(error.statusCode).send({
			type: "appError",
			error: error.toJSON(),
		});
	}

	// if (error instanceof ZodError) {
	// 	const formattedErrors = error.issues.map((err) => ({
	// 		field: err.path.join("."),
	// 		message: err.message,
	// 	}));

	// 	return rep.status(400).send({
	// 		type: "validation",
	// 		errors: formattedErrors,
	// 	});
	// }

	const fastifyError = error as FastifyError;

	if (fastifyError.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
		return rep.status(400).send({
			type: "validation",
			message:
				"O corpo da requisição não é um JSON válido. Verifique a sintaxe.",
		});
	}

	if (fastifyError.validation) {
		return rep.status(400).send({
			type: "validation",
			errors: fastifyError.validation.map((err) => ({
				field: err.instancePath.replace(/^\//, "") || "body",
				message: err.message,
			})),
		});
	}

	req.log.error({ err: error }, "Ocorreu um erro não tratado");

	return rep.status(500).send({
		type: "generalError",
		message: "Ocorreu um erro interno no servidor.",
	});
};