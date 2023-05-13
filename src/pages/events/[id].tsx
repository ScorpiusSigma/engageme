import Navbar from "@/components/Navbar/Navbar";
import { Button, TextField } from "@mui/material";
import { Router, useRouter } from "next/router";
import { useState } from "react";


export default function Event() {
    const router = useRouter();
    const {id} = router.query

    const [evtDeets, setEvtDeets] =  useState({});

    const fetchEventById = async () => {
        const response = await fetch("/api/todos");
        const data = await response.json();
        setEvtDeets(data);
    };


    return (

        <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-800 dark:text-white font-robo">
            <Navbar />
            <div className="relative pt-16 mx-4">

                <div className="relative mt-4 font-semibold text-5xl ">
                    insert_event_name_here
                </div>
                <div className="mt-4">

                </div>
            </div>
        </div>
    )
}