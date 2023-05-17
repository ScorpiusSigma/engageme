import useWindowSize from "@/hooks/WindowResize";
import { getMintAddressOfToken, getNFTFromToken } from "@/utils"
import { createQR } from "@solana/pay";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletConnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import ReactCardFlip from 'react-card-flip';


export default function PartProfile() {
    const router = useRouter()

    const { publicKey } = useWallet();

    const { windowSize } = useWindowSize()

    const [isOwner, setIsOwner] = useState(false);
    const [pDeets, setPDeets] = useState<any>(null);
    const [nftDeets, setNFTDeets] = useState<any>(null);

    const [isImgFlip, setImgFlip] = useState(false)
    const [status, setStatus] = useState<string>();
    const [qrCode, setQrCode] = useState<string>();

    useEffect(() => {
        if (!router.isReady || !publicKey) return
        const { id, p_id } = router.query;
        // fetchParticipant(id as string, p_id as string).then(fetchNFT)
        const temp = {
            evt_token_addr: "Aio6LF739QngJKVW98yBHqqaS8SVBugK6kb6Q3AJTyAm"
        }
        setPDeets(temp)
        fetchNFT(temp)
    }, [router.isReady, publicKey])

    const fetchParticipant = async (e_id: string, p_id: string) => {
        const res = await fetch(`/api/events/${e_id}/${p_id}`)
        if (res.status != 200) {
            return null
        }
        const data = await res.json();
        setPDeets(data)
        return data
    }

    const fetchNFT = async (part_data: any) => {
        console.log("Fetch nft")
        console.log(part_data)
        const nft = await getNFTFromToken(part_data.evt_token_addr) as any
        console.log(nft)
        setNFTDeets(nft.json)
        const mintAddress = nft?.collection?.address.toString();
        console.log(`mintAddress: ${mintAddress}`)
        // if (mintAddress == publicKey) {
        setIsOwner(true);
        getQrCode(part_data)
        // }
    }

    const flipCard = () => {
        if (!isOwner) return
        setImgFlip(!isImgFlip)
    }

    const getQrCode = async (part_data: any) => {
        // console.log(pDeets)
        const pDeets = part_data
        let params = JSON.stringify({
            account: publicKey,
            token: pDeets.evt_token_addr,
            orgAccount: publicKey,
        });
        console.log(params);

        const res = await fetch("/api/attendance", {
            method: "POST",
            body: params,
            headers: new Headers({
                'Content-Type': 'application/json',
                Accept: 'application/json',
            })
        });
        if (res.status != 200) {
            setStatus((await res.json()).error);
            return;
        }
        const { qrcode } = await res.json();
        console.log(qrcode);
        // 2 - Generate a QR Code from the URL and generate a blob
        const qr = createQR(qrcode);
        const qrBlob = await qr.getRawData("png");
        if (!qrBlob) return;
        // 3 - Convert the blob to a base64 string (using FileReader) and set the QR code state
        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === "string") {
                setQrCode(event.target.result);
            }
        };
        reader.readAsDataURL(qrBlob);
    };

    return (
        <div className=" flex justify-center items-center h-screen w-full flex-col">
            {!publicKey && (
                <div className="mb-4">Please connect first! </div>
            )}
            {publicKey && nftDeets &&
                (
                    <>
                        <ReactCardFlip isFlipped={isImgFlip} flipDirection="horizontal" key="front" >
                            <img src={nftDeets.image} className="rounded-3xl" style={{
                                height: (windowSize.height || 100) / 2
                            }} onClick={flipCard} />
                            <img key="back" onClick={flipCard}
                                src={qrCode}
                                style={{ position: "relative", background: "white" }}
                                alt="QR Code"
                                // width={"50%"}
                                height={(windowSize.height || 100) / 2}
                                // priority
                            />
                        </ReactCardFlip>

                        {pDeets && Object.entries(pDeets).map(([k, v]) => {
                            return (
                                <div className="my-2">
                                    <span>{k}: </span> <span>{v as string}</span>
                                </div>
                            )
                        })}
                    </>
                )}
            <WalletMultiButton/>
            {isOwner && (
                <div></div>
            )}
        </div>
    )
}