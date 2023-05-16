import Navbar from "@/components/Navbar/Navbar";
import { Button, TextField } from "@mui/material";
import { useState } from "react";

export default function CreateEvents() {

    const [name, setName] = useState("");

    const creteEvent = async() => {
        const params = JSON.stringify({
            name: ""
        })
        const res = await fetch("/api/events/create", {
            method: "POST",
            body: params,
            headers: new Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
            })
          });
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
                    <TextField id="filled-basic" label="Description" fullWidth placeholder="A day to unwind with chill movies" variant="outlined" />
                </div>
                <div className="relative mb-4 flex justify-center items-center">
                    <TextField id="filled-basic" label="Start Date" variant="outlined" />
                    <span className="mx-4"> to </span>
                    <TextField id="filled-basic" label="End Date" variant="outlined" />
                </div>
                <Button variant="contained" className=" text-black dark:text-white">Create 🌈</Button>
                
            </div>
        </div>
    )
}