import Navbar from "@/components/Navbar/Navbar";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Events() {
	// let events: any[] = [];

	const router = useRouter()

	const [events, setEvents] = useState([]);

	const fetchEvents = async () => {
		const res = await fetch("/api/events");
		console.log(res)
		if (res.status != 200) {
			return
		}
		let data = await res.json();
		data = data.map((el: any) => {
			let toRet: { [name: string]: any } = {}
			for (const [k, v] of Object.entries(el)) {
				if (k == "organiser") continue;
				toRet[k] = Object.values(v as any)[0];
			}
			return toRet
		})
		console.log(data)
		setEvents(data)
	}

	useEffect(() => {
		fetchEvents();
	}, [])

	return (
		<div className="h-screen w-full bg-white dark:bg-slate-800 dark:text-white font-robo relative">
			<Navbar />
			<div className="relative pt-16 px-4 w-full">
				<div className="relative mt-4 font-semibold text-5xl ">
					Your events
				</div>

				<div className="mt-4 w-full">
					{events.length == 0 ? (
						<div>
							You don&apos;t have any! Click{" "}
							<Link
								href={"/events/create"}
								className=" underline text-my_blue"
							>
								here
							</Link>{" "}
							to create your first event :)
						</div>
					) : (
						<Table className="">
							<TableHead className="">
								<TableRow className="">
									{
										Object.entries(events[0]).map(([k, v]: [any, any], j) => {

											if (k == "evnet_id") { return }
											return (
												<TableCell key={j}>{k}</TableCell>
											)
										})
									}
									{/* <TableCell>Name</TableCell>
									<TableCell align="right">
										Attendance
									</TableCell>
									<TableCell align="right">
										Start Date
									</TableCell>
									<TableCell align="right">
										End Date
									</TableCell> */}
								</TableRow>
							</TableHead>
							<TableBody>
								{events.map((x: any, i) => (
									<TableRow key={x["evnet_id"]} className=" cursor-pointer hover:bg-slate-300" onClick={
										(e)=>{
											router.push(`/events/${x["evnet_id"]}`)
										}
									}>{
										Object.entries(x).map(([k, v]: [any, any], j) => {
											if (k == "evnet_id") { return }

											return (
												<TableCell key={j}>{v}</TableCell>
											)
										}

										)
									}</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</div>
			</div>
		</div>
	);
}