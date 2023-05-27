import { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { generateQrCodeLink, getMintAddressOfToken } from "@/utils";

type InputData = {
	account: string;
	wallet: string;
	token: string;
	mintAccount: string;
	eventId: string;
};

type GetResponse = {
	label: string;
	icon: string;
};

export type PostResponse = {
	qrcode: string;
};

export type PostError = {
	error: string;
};

async function post(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	const { account, token, eventId } = req.body as InputData;

	if (!account) {
		res.status(400).json({ error: "No wallet provided" });
		return;
	}

	if (!token) {
		res.status(400).json({ error: "No token provided" });
		return;
	}

	if (!eventId) {
		res.status(400).json({ error: "No event ID provided" });
		return;
	}

	try {
		const response = {
			qrcode: generateQrCodeLink(
				new PublicKey(account),
				new PublicKey(token),
				new PublicKey(
					await getMintAddressOfToken(new PublicKey(token))
				),
				eventId
			),
		};

		console.log(response);
		res.status(200).json(response);
		return;
	} catch (error) {
		res.status(500).json({ error: "error creating transaction" });
		return;
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
	if (req.method === "POST") {
		return await post(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}
