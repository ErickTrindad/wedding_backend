import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const r2Client = new S3Client({
	region: "auto",
	endpoint: process.env.CF_ENDPOINT,
	credentials: {
		accessKeyId: process.env.CF_ACCESS_KEY_ID as string,
		secretAccessKey: process.env.CF_SECRET_ACCESS_KEY as string,
	},
});

export async function uploadToR2(
	fileBuffer: Buffer,
	mimetype: string,
	originalName: string,
): Promise<string> {
	const fileExtension = originalName.split(".").pop();
	const fileName = `casamento/${randomUUID()}.${fileExtension}`;

	const command = new PutObjectCommand({
		Bucket: process.env.CF_BUCKET_NAME,
		Key: fileName,
		Body: fileBuffer,
		ContentType: mimetype,
	});

	await r2Client.send(command);

	const publicUrl = `${process.env.CF_PUBLIC_URL}/${fileName}`;

	return publicUrl;
}
