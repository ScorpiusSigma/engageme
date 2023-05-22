import { NextApiRequest, NextApiResponse } from "next";
import { aggAttendanceMetric, getAttendanceMetric } from "@/utils";

type GetResponse = ({
	datetime: Date;
	account: string;
}[] | { dateString: any; date: number; count: any; }[]);
//toAgg
// type GetResponseAgg = {
// 	date: Date;
//     count: number;
// }[];

type GetResponseAgg = {
	date: any;
	// e_time: any;
	count: any;
}[];

type InputData = { account: string };


export type PostError = {
	error: string;
};

async function get(req: NextApiRequest, res: NextApiResponse) {

	const { isAgg } = req.query;
	// console.log(`isAgg: ${isAgg}`)
	let toAgg = false
	if (isAgg == undefined) {
		toAgg = true
	} else {
		toAgg = (isAgg as string).toLowerCase() == 'true'
	}
	// console.log(`isAgg: ${toAgg}`)

	try {
		let data: {
			datetime: Date;
			account: string;
		}[] = await getAttendanceMetric();
		if (toAgg) {
			let data2 = aggAttendanceMetric(data)
			console.log(data2)
			res.status(200).json(data2);
			return
		}
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
	res: NextApiResponse<GetResponse | GetResponseAgg | PostError>
) {
	if (req.method === "GET") {
		return await get(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}
