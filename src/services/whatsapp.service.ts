import type { Client as ClientType } from "whatsapp-web.js";
import pkg from "whatsapp-web.js";
import prisma from "../config/prisma.js";

const { Client, LocalAuth } = pkg;

import { AppError } from "../utils/appError.js";

class WhatsAppService {
	private client: ClientType;
	private qrCode: string | null = null;
	private connectionStatus:
		| "DISCONNECTED"
		| "INITIALIZING"
		| "WAITING_QR"
		| "CONNECTED" = "DISCONNECTED";

	constructor() {
		this.client = new Client({
			authStrategy: new LocalAuth(),
			puppeteer: {
				headless: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-accelerated-2d-canvas",
					"--no-first-run",
					"--no-zygote",
					"--single-process",
					"--disable-gpu",
				],
			},
		});

		this.client.on("qr", (qr) => {
			this.qrCode = qr;
			this.connectionStatus = "WAITING_QR";
		});

		this.client.on("ready", () => {
			this.qrCode = null;
			this.connectionStatus = "CONNECTED";
			console.log("WhatsApp logado e pronto");
		});

		this.client.on("disconnected", () => {
			this.connectionStatus = "DISCONNECTED";
			this.qrCode = null;
			this.client.initialize();
		});
	}

	async startClient() {
		if (this.connectionStatus === "DISCONNECTED") {
			this.connectionStatus = "INITIALIZING";
			await this.client.initialize();
		}
	}

	getStatus() {
		return {
			status: this.connectionStatus,
			qrCode: this.qrCode,
		};
	}

	async logout() {
		if (this.connectionStatus === "CONNECTED") {
			await this.client.logout();
			this.connectionStatus = "DISCONNECTED";
			this.qrCode = null;
		}
	}

	async sendInvites(targets: { familyId: string; phone: string }[]) {
		if (this.connectionStatus !== "CONNECTED") {
			throw new AppError(
				400,
				"O WhatsApp dos noivos não está conectado. Leia o QR Code primeiro.",
			);
		}

		// Processamento em background (não trava o retorno da requisição HTTP)
		(async () => {
			for (const target of targets) {
				try {
					const family = await prisma.family.findUnique({
						where: { id: target.familyId },
					});

					if (!family) continue;

					// Monta a mensagem e o link (Ajuste a URL do front-end conforme o seu ambiente)
					const inviteLink = `${process.env.FRONTEND_URL}/auth?code=${family.accessCode}`;
					const message = `*Convite de Casamento!*\n\nOlá, Família ${family.name}!\nÉ com muita alegria que convidamos vocês para o nosso casamento.\n\nPara confirmar sua presença, ver detalhes do local e acessar nossa lista de presentes, clique no link seguro abaixo:\n\n🔗 ${inviteLink}`;

					// Formatação do número para o padrão do WhatsApp (55 + DDD + Numero + @c.us)
					const formattedPhone = `55${target.phone.replace(/\D/g, "")}@c.us`;

					await this.client.sendMessage(formattedPhone, message);

					// Sistema Anti-Ban: Delay aleatório entre 5 e 15 segundos
					const delay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
					await new Promise((resolve) => setTimeout(resolve, delay));
				} catch (error) {
					console.error(
						`Erro ao enviar convite para a família ${target.familyId}:`,
						error,
					);
				}
			}
		})();

		return {
			message:
				"Disparos iniciados em segundo plano. Verifique o celular para acompanhar os envios.",
		};
	}
}

export const whatsappService = new WhatsAppService();
