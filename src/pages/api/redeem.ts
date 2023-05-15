/**
 * #TODO: check is datetime is enabled for redemption
 * Check how many time this link has been hit before redemption
 * uuid map to NFT
 *
 * User will have the qr generated on their website and organiser will scan with their phone to verify the user
 *
 * 24032023faoisjfneljnvpaidsuhnr
 *  */

import { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { isRedeemed, redeem } from "@/utils";

type GetResponse = {
	label: string;
	icon: string;
};

type InputData = { account: string };

export type PostResponse = {
	transaction: string;
	message: string;
};

export type PostError = {
	error: string;
};

async function postImpl(recvWallet: PublicKey) {
	try {
		// TODO: Need to check if the wallet is whitelisted and get the respective NFT for transfer
		const res = await redeem(recvWallet);
		return {
			message: `NFT transferred with transaction signature: ${res}`,
		};
	} catch (error) {
		throw error;
	}
}

async function post(req: NextApiRequest, res: NextApiResponse) {
	const { account } = req.body as InputData;

	if (!account) {
		res.status(400).json({ error: "No account provided" });
		return;
	}

	if (await isRedeemed(new PublicKey(account))) {
		res.status(500).json({ error: "NFT already redeemed!" });
	}

	try {
		const resp = await postImpl(new PublicKey(account));
		res.status(200).json(resp);
		return;
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error minting" });
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
