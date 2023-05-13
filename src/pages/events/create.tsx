import Navbar from "@/components/Navbar/Navbar";
import { Button, TextField } from "@mui/material";


export default function CreateEvents() {
    return (

        <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-800 dark:text-white font-robo">
            <div className="flex flex-col">
                <TextField id="filled-basic" label="Name" variant="outlined" />
                <Button variant="contained" className=" text-black dark:text-white mt-4">Create 🌈</Button>
            </div>
        </div>
    )
}