import Navbar from "@/components/Navbar/Navbar";
import { Button, TextField } from "@mui/material";
import Datepicker from "react-tailwindcss-datepicker"; 

import { useState } from "react";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";

enum Status {
    wait,
    success,
    nth,
    err
}

export default function CreateEvents() {

    const router = useRouter();
    const { publicKey } = useWallet();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [dates, setDates] = useState<DateValueType>(null);

    const [submitStatus, setSubmitStatus] = useState(Status.nth)
    const [statMsg, setStatMsg] = useState("");

    if (!publicKey) { 
        router.push("/")
    }

    const creteEvent = async() => {

        let startDate = dates?.startDate
        let endDate = dates?.endDate
        if (startDate == null || endDate == null) {
            setSubmitStatus(Status.err)
            setStatMsg("Please fill in all form fields!")
            return
        }

        const params = JSON.stringify({
            name: name,
            description: description,
            startDate: startDate,
            endDate: endDate,
            organiser: publicKey
        })
        const res = await fetch("/api/events/create", {
            method: "POST",
            body: params,
            headers: new Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
            })
          });

        if (res.status != 200) {
            setSubmitStatus(Status.err)
            setStatMsg("Invalid form submission, please try again.");
            return
        }
        const { id } = await res.json();


        setSubmitStatus(Status.success)
        setStatMsg("Success! You'll be redirected to your event page shortly~")
        setTimeout(()=>{
            router.push(`/events/${id}`);
        }, 1000)
    }

    return (

        <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-800 dark:text-white font-robo">
            <div className="flex flex-col">
                <div className="relative mb-4 ">
                    <TextField id="filled-basic" label="Name" fullWidth placeholder="Friday Movie Night" variant="outlined" value={name} onChange={(e)=>{
                        setName(e.target.value)
                    }} />
                </div>
                <div className="relative mb-4">
                    <TextField id="filled-basic" label="Description" fullWidth placeholder="A day to unwind with chill movies" variant="outlined" value={description} onChange={(e)=>{
                        setDescription(e.target.value)
                    }}/>
                </div>
                <div className="relative mb-4 flex justify-center items-center">
                    <Datepicker value={dates} onChange={(date) => {
                        setDates(date)
                    }} />
                </div>
                {submitStatus != Status.nth && (
                    <div className={Status.err?" text-red-500": "text-green-500"}>
                        {statMsg}
                    </div>
                )}
                <Button variant="contained" className=" text-black dark:text-white" onClick={creteEvent}>Create 🌈</Button>
                
            </div>
        </div>
    )
}