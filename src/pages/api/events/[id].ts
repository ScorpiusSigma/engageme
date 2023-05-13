import { NextApiRequest, NextApiResponse } from "next";
type GetResponse = {
	start_date: Date;
	end_date: Date;
};
type PostParam = {
	id: string,
	name: string,
	start_date: Date,
	end_date: Date
}

type PostResponse = {
	message: string;
};
type PostError = {
	error: string;
};

function get(res: NextApiResponse<GetResponse>) {
	res.status(200).json({
        start_date: new Date("2023-05-20"),
        end_date: new Date("2023-05-27"),
	});
}

async function postImpl(evtDetails: PostParam)  : Promise<PostResponse> {
	const message =
		"Event Edit Success!";
	return {
		message
	}
}

async function post(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	const details = req.body as PostParam;
    try{
		const output = await postImpl(details);
        res.status(200).json(output);
		return;
    } catch (error) {
		console.error(error);
		res.status(500).json({ error: "error editting event" });
		return;
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
	if (req.method === "GET") {
        // Getting the details for the events
		return get(res);
	} else if (req.method === "POST") {
        // edit event details
		return await post(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}