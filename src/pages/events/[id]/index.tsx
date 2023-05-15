import Navbar from "@/components/Navbar/Navbar";
import { Button, TextField } from "@mui/material";
import { Router, useRouter } from "next/router";
import { useState } from "react";


export default function Event() {
    const router = useRouter();
    const { id } = router.query

    const [evtDeets, setEvtDeets] = useState({
        name: "Solana Hackathon",
        startDate: "20/5/23",
        endDate: "27/5/23",
    });

    const participants = [
        "0x123"
    ]

    const fetchEventById = async () => {
        const response = await fetch("/api/todos");
        const data = await response.json();
        setEvtDeets(data);
    };


    return (

        <div className="h-screen w-full bg-white dark:bg-slate-800 dark:text-white font-robo relative">
            {/* <div className="bg-black rounded-b-xl absolute top-0 left-0 h-1/3 w-full"></div> */}
            <Navbar />
            <div className="relative pt-16 mx-4">
                <div className="relative mt-4 font-semibold text-4xl ">
                    {evtDeets.name}
                </div>
                <div className="mt-4 flex items-center  justify-between">
                    <div>
                        insert_description
                    </div>
                    <div>
                        {`${evtDeets.startDate} to ${evtDeets.endDate}`}
                    </div>
                </div>
                {/* participants */}
                <div className=" rounded-lg bg-white shadow-md p-4">
                    <div className="mb-4">
                        <div>
                        Participants
                        </div>
                        <div>
                            
                        </div>
                    </div>
                    {/* table */}
                </div>
            </div>
        </div>
    )
}