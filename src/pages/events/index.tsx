import Navbar from "@/components/Navbar/Navbar";
import { TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import Link from "next/link";


export default function Events() {

    let events: any[] = []
    return (

        <div className="h-screen w-full bg-white dark:bg-slate-800 dark:text-white font-robo relative">
            <Navbar />
            <div className="relative pt-16 mx-4">
                <div className="relative mt-4 font-semibold text-5xl ">
                    Your events
                </div>

                <div className="mt-4">
                    {events.length == 0 ? (
                        <div>You don't have any! Click <Link href={'/events/create'} className=" underline text-my_blue">here</Link> to create your first event :)</div>
                    ) :
                        (
                            <TableContainer>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="right">Attendance</TableCell>
                                        <TableCell align="right">Start Date</TableCell>
                                        <TableCell align="right">End Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>

                                    {
                                        events.map(() => (
                                            <TableRow></TableRow>
                                        ))
                                    }
                                </TableBody>
                            </TableContainer>
                        )

                    }
                </div>
            </div>
        </div>
    )
}