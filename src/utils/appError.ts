import http from "node:http";

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly error: string;

	constructor(statusCode: number, message: string) {
		super(message);

		this.statusCode = statusCode;
		this.error = http.STATUS_CODES[statusCode] || "Unknown Error";

		Object.setPrototypeOf(this, AppError.prototype);
	}

	public toJSON() {
		return {
			statusCode: this.statusCode,
			error: this.error,
			message: this.message,
		};
	}
}