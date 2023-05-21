import { NextApiRequest, NextApiResponse } from "next";
import { getAttendanceMetric } from "@/utils";

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

async function get(req: NextApiRequest, res: NextApiResponse) {
	try {
		const data = await getAttendanceMetric();

		// const resp = await postImpl(new PublicKey(account));
		res.status(200).json({
			data,
		});
		return;
	} catch (error) {
		res.status(500).json({ error: "Error minting" });
		return;
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
	if (req.method === "GET") {
		return await get(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}
