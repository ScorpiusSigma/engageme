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
        <div className="flex items-center justify-between fixed h-16 w-full px-2 border border-b-slate-300 border-solid bg-white dark:bg-gray-800">
            <div className="h-full">
                <img
                    src={`${isDark?"/EngageMeLogoDark.png":"/EngageMeLogo2.png"}`}
                    alt="clickable image"
                    className="h-full"
                />
            </div>
            <div className="flex items-center h-full">
                <DarkLight />
                <div className="border border-r-slate-300 border-solid mx-4 h-2/3" />
                <WalletMultiButton />
            </div>

        </div>
    )
}