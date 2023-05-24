import { NextApiRequest, NextApiResponse } from "next";
import { aggAttendanceMetric, getAttendanceMetric } from "@/utils";

const FAKE_DAYS = [
	(new Date(2023,4,21)).toISOString(),
	(new Date(2023,4,22)).toISOString(),
	(new Date(2023,4,23)).toISOString(),
	(new Date(2023,4,24)).toISOString(),
	(new Date(2023,4,25)).toISOString(),
	(new Date(2023,4,26)).toISOString(),
	(new Date(2023,4,27)).toISOString(),
	(new Date(2023,4,28)).toISOString(),
]

const WALLET_CHOICES = [
	"wJmoWMWf5QtJ5xt3LH7PXRPK8r1Jw24EcsdSEQLkCWo",
	'fS9HE96UePxNp1YgEiSFENTh6NLnJg6gUT15dDWHdAV',
	'e2Hw0YMtxLHdFXrG9r1wVlMxq0dFvRju71J1yYbbwMm',
	'a2daCCojMImrz11B1yDz4vOW7pTjkqxlI2QbDnWQqsV',
	'lk19A3sOAPFoCxE5TKUqL4N81Yc8FfHJsY4fQf656Lg',
	'UxReXPV4doJweyX3IlMJxHaAnhCj0vBot73yqxU52Wu',
	'E69MuEJD2UNltJYdGJBOCYnnkF3erZ7pKACLyDf9IsW',
	'6MXveE7jkGMqW1iabAjLNfuAq8abom9eOPWWmfllUZV',
	'8uIhLylPYLI5IuOsm79hhPriVShjJUf2nm0umgvLZc0',
	'qW6dKDxJrtaRmYOXw1boxnNzdzlyFqvD6xtPD3MwG7k',
	'oWwjlr5so7vcQlm5arA3xSAkxHTJRj2CT1Chbj1zU7m',
	'73JZ3LTv6QJYYFg39CIObggQulJLpzMp8UqT0CHh6CV',
	'CZfIlm0GAEBRMn8H3FCobtnpnrfFyUsUMVQWqnyy9um',
	"mKtfs2Y6sJFcbRFfCJgoRwT91yUu6TZA7DyD74yPqU0",
	's42eaIGz57gtsrAepA9uXYpcbZo84LEbkvV5meKD5Dw',
	"y2ZyZUEkjrzlJ02t5wVq25cDfdVNYdqNZWHUiajFqMs",
	"yKWLG21sUI65aaPetXVHDyE4EdRY9abSaNzlboKJKAZ",
	"ioFpiVe5TCOY1BggmKvU16AnbCeAnbZCHAJmNTmejfz",
	"TdJyZCVCdMpPlvxc49MPQtXRmkvnAHlcYhI7v7BgwAr",
	"T6SD3AmDV5ZBD8fKbEJIgve1RhBNQ3gt1nFTc12PXlB",
	"bvHPO7yj2z2TIjMyI53EmEEJYBVAoleQlGjLj05PkCo",
	"Dl6MorYX1l6v4wJ93TpkwcmS1l91iuwI9vNjEgBp2L5",
	"O78P8hCbJFoWkUmG94DbDD72Kb5npiSqXDXLhQTj4WD",
	"oPnuwDAXCtNhwY4TYB2QDToEiPd9gLU4TSHF6wd5VGv",
	"GOo4Xdw92TKJLDCHnuZLoEs6dcYgTZPaJybgfFnTERl",
	"VZ0MvC9by8jFMU6CTJ63UiK9wdX17i2i6BT1SQH1pCe",
	"292tIvCLyPXeJ0mSlpCJNSt1M968K3q42Mdqg7DPUIX",
	"h09PYRMchEu29JGHsV9TI9U9FoFMhRTsbtaszF1qm8t",
	"XpKCEvdY4hYZBV69KUjS0SjB7QKmQZFWP9OyIXLFRly",
	"C6bgQTLAzdI2Z3qqI0ygKv92D2KyxXhlJOk0NQCHHV5",
	"07BL5gxGyuQDtdM3EsQ8E4TP3QjbpwYhjSX7DKcuNNP",
	"xekLWbeTFE6lnstmBoM8BHeRHHyR7qGjbnRYXDlTIor",
	"N9xVrxWQLyqYMfMmfGn3vDUCbWDEmdqRVu4US7UEs5c",
	"c9YlDLg90pfZq2aLBfs0cCo2KWdea2S6p9LdPjqKCB7",
	"cDduyzTWiQbDvUXk5wO0AHHHXcGPmlTrJac0UPMYphJ",
	"In8V5O6009vACC40OlpCSmQv7ShY708xHvTQ9lheUbh",
	"qEdHNJvyGlChRYliPLhyDeyXVcarKeMz2SJb0LcHZQW",
	"8jzkWGMKsrkFLs1ut5R7NKgpWlA3eIPbnEDUNgWYuuj",
	"fOb0uYdzFQQ4IBwNRrq0SBIQqFr0lX19LqJ2kjVwvZK",
	"FBteuQZkx1dVU8dQCd9hU0nj9qemyzUdvxEZZZuDJaf",
	"CyV5QLud3ebYNXy1dNy0iUyTRmum6Zz0v2R9sTS0fzm",
	"riWwwTAoTtrnyW9BUUCLsGiw1ZzfPLfcJ3cTKU1Tcu6",
	"erlldpIS57eGBRuKRZkoLUKeJlMhfFTluYiuaqvct2U",
	"v8r1YfLgr0EvBqdyjz7OA45rdrdTy1T5tlXd319fT85",
	"q8q4l5Z6MGjzKuvfowPkWAVTbseYMwqnntdpFDpsoC1",
	"iWYIAUWssoXGfFnzTdvPIirCCo606uFZGdv5sjVzYJN",
	"MkeIUhqvHAo3WRhFGSSfByNtKvvhDRlKalEV2uZjYEh",
	"I9sJVCCT5tITSqw2qUqPVLlc8kMH35pWyq34SXzOlMy",
	"H8omBDEYlB9trM9UzSw2UsH1L6WSTMmzRNHa3MGCtdQ",
	"DPhNa5Zb6Dhgpm08e9lcZhzYG0AaJo6ldw58LLf6sPw",
	"7ToGy92gRWGFBiAE9fhMLr8V6qkX1aznG43Tzwwdb4E",
	"E95P7Xu92h0mrK94POrZ8vQQgIj4o88jIlddYW6AX9t",
]

const randomG = (v: number) => { 
    var r = 0;
    for(var i = v; i > 0; i --){
        r += Math.random();
    }
    return r / v;
}

const rand_day = () => {
	return FAKE_DAYS[Math.floor(randomG(7) * FAKE_DAYS.length)]
}

const rand_addr = () => {
	return WALLET_CHOICES[Math.floor(randomG(7) * WALLET_CHOICES.length)]
}

const gen_fake_data = (atLeast: number) => {
	let to_ret: any = {}
	for (let i = 0; i < atLeast; i++) {
		const rand_k = rand_day()
		const rand_v = rand_addr();		
		if (rand_k in to_ret) {
			to_ret[rand_k].add(rand_v)
		} else {
			to_ret[rand_k] = new Set([rand_v])
		}
	}
	// console.log(to_ret)
	return Object.entries(to_ret).reduce((pv: any, [k, v]: [any, any]) => {
			let to_extend = []
			let vals = Array.from(v);
			// console.log(`k: ${k}, ${new Date(k)}`)
			// console.log(`v: ${v}`)
			for (const val of vals){
				to_extend.push({
					datetime: new Date(k),
					account: val
				})
			}
			pv.push(...to_extend)
			return pv
		}
	,[])
}


const FAKE_ATTEN = gen_fake_data(200)
// const FAKE_ATTEN: {
// 	datetime: Date,
// 	account: string
// }[] = gen_fake_data(200)

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
		}[] = FAKE_ATTEN //await getAttendanceMetric();
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
