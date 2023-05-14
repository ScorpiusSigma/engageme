import { NextApiRequest, NextApiResponse } from "next";

type PostParam = {
	name: string,
}
type PostResponse = {
	message: string;
    id: string
};
type PostError = {
	error: string;
};

async function postImpl(evtDetails: PostParam)  : Promise<PostResponse> {
	const message =
		"Event Edit Success!";
        const id = (1).toString(); // stick to incremental id , then can follow this method possibly https://stackoverflow.com/questions/53550001/get-latest-max-for-each-partition-key
	return {
		message,
        id
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
	res: NextApiResponse<PostResponse | PostError>
) {
    if (req.method === "POST") {
        // edit event details
		return await post(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}