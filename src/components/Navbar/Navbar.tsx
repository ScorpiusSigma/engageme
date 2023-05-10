import Link from "next/link"
import Image from "next/image"

import { useRouter } from "next/router"

export default function Navbar(){
    return (
        <div className="flex w-100 h-16">
            <div>
                <img
                    src="/ENGAGEME.svg"
                    alt="clickable image"
                    className="h-8 w-8"
                  />
            </div>
        </div>
    )
}