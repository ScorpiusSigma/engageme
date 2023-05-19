import Link from "next/link"
import Image from "next/image"

import { useRouter } from "next/router"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import DarkLight from "../DarkLight"
import useToggleTheme from "@/hooks/ToggleTheme"
import { useEffect } from "react"

export default function Navbar() {
    const {isDark} = useToggleTheme();
    useEffect(()=>{
        

    },[])
    return (
        // bg-white dark:bg-gray-800
        <div className="flex items-center justify-between fixed z-50 h-16 w-full px-2 border border-b-slate-300 border-solid bg-white/50 dark:bg-gray-800/50 backdrop-blur-3xl">  
            <div className="h-full">
                <img
                    src={`${isDark?"/EngageMeLogoDark.png":"/EngageMeLogo2.png"}`}
                    alt="clickable image"
                    className="h-full"
                />
            </div>
            <div className="flex items-center h-full">
                <Link href={"/events"} className="mr-4 text-gray-400"> Events </Link>
                <DarkLight />
                <div className="border border-r-slate-300 border-solid mx-4 h-2/3" />
                <WalletMultiButton />
            </div>

        </div>
    )
}