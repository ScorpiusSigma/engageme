import { ddbClient, ddbTables } from "@/utils";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { NextApiRequest, NextApiResponse } from "next";
// import { PostError } from "../../attendance-auth";

type PostResponse = {
	is_attendance_taker: boolean;
};

type PostError = {
	error: string;
};

async function postImpl(
	e_id: string,
	publicKey: string
): Promise<PostResponse> {
	const client = ddbClient;
	const { Item } = await client.send(
		new GetItemCommand({
			TableName: ddbTables.atten,
			Key: {
				event_id: { S: e_id },
				taker_addr: { S: publicKey },
			},
		})
	);

	return {
		is_attendance_taker: Item ? true : false,
	};
}

async function post(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	const { id } = req.query; // Retrieve the square bracket param
	const { publicKey } = req.body;

	if (id == undefined) {
		res.status(400);
		return;
	}
	try {
		const output = await postImpl(id as string, publicKey);
		res.status(200).json(output);
	} catch (e) {
		res.status(500).json({
			is_attendance_taker: false,
		}); //{ error: "Error Looking up attendance taker" }
	}
	return;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	if (req.method === "POST") {
		// Getting the details for the events
		return await post(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}
