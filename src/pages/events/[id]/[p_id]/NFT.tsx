import useWindowSize from "@/hooks/WindowResize";
import { getNFTFromToken, getNFTOwnerWallet, isRedeemed } from "@/utils";
import { createQR } from "@solana/pay";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactCardFlip from "react-card-flip";

const WalletMultiButton = dynamic(
	async () =>
		(await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
	{ ssr: false }
);

export default function PartProfile() {
	const router = useRouter();

	const { publicKey } = useWallet();

	const { windowSize } = useWindowSize();

	const [isOwner, setIsOwner] = useState(false);
	const [isEvtNFTClaimed, setIsEvtNFTClaimed] = useState(false);
	const [pDeets, setPDeets] = useState<any>(null);
	const [nftDeets, setNFTDeets] = useState<any>(null);
	let orgAddr = "";
	// const [orgAddr, setOrgAddr] = useState<string>("");

	const [isImgFlip, setImgFlip] = useState(false);
	const [status, setStatus] = useState<string>();
	const [qrCode, setQrCode] = useState<string>();

	useEffect(() => {
		if (!router.isReady || !publicKey) return;
		const { id, p_id } = router.query;
		checkEvtRedeemed();
		let miao = fetchParticipant(id as string, p_id as string);
		miao.then(fetchNFT);
		miao.then(setPDeets);
		// const temp = {
		//     evt_token_addr: "9pBcndZY6cbXSCqHemnmL3Aj74QERh4E2GdcMaDQz3GM",//"Aio6LF739QngJKVW98yBHqqaS8SVBugK6kb6Q3AJTyAm"
		// }
		// setPDeets(temp)
		// fetchNFT(temp)
	}, [router.isReady, publicKey]);

	const checkEvtRedeemed = async () => {
		if (!publicKey) return;
		setIsEvtNFTClaimed(await isRedeemed(publicKey));
	};

	const fetchOrganiser = async (e_id: string) => {
		const res = await fetch(`/api/events/${e_id}`);
		if (res.status != 200) return null;
		const data = await res.json();
		// setOrgAddr(data.organiser.S);
		orgAddr = data.orgProxy.S;
	};

	const fetchParticipant = async (e_id: string, p_id: string) => {
		const res = await fetch(`/api/events/${e_id}/${p_id}`);
		if (res.status != 200) {
			return null;
		}
		const data = await res.json();
		for (const [k, v] of Object.entries(data)) {
			data[k] = Object.values(v as any)[0];
		}
		setPDeets(data);
		console.log("fetch participant");
		console.log(data);
		return data;
	};

	const fetchNFT = async (part_data: any) => {
		const { id } = router.query;
		console.log("Fetch nft");
		console.log(part_data);
		let token_addr = part_data?.evt_token_addr;
		if (!token_addr) {
			return;
		}
		const nft = (await getNFTFromToken(part_data.evt_token_addr)) as any;
		// console.log("nft")
		// console.log(nft)
		// console.log(nft?.address.toString())
		// console.log(nft?.mint?.address.toString())
		setNFTDeets(nft.json);

		// const mintAddress = nft?.collection?.address.toString();
		const owner = await getNFTOwnerWallet(token_addr);
		// console.log(`owner: ${owner} vs public key: ${publicKey}`)
		if (owner == publicKey) {
			setIsOwner(true);
			await fetchOrganiser(id as string);
			getQrCode(part_data);
		}
	};

	const flipCard = () => {
		if (!isOwner) return;
		setImgFlip(!isImgFlip);
	};

	const getQrCode = async (part_data: any) => {
		// console.log(pDeets)
		console.log("QR CODE orgAddr: ", orgAddr);
		const pDeets = part_data;
		let params = JSON.stringify({
			account: publicKey,
			token: pDeets.evt_token_addr,
			orgAccount: orgAddr,
		});
		console.log(params);

		const res = await fetch("/api/attendance", {
			method: "POST",
			body: params,
			headers: new Headers({
				"Content-Type": "application/json",
				Accept: "application/json",
			}),
		});
		if (res.status != 200) {
			setStatus((await res.json()).error);
			return;
		}
		const { qrcode } = await res.json();
		console.log("qrcode");
		console.log(qrcode);
		// 2 - Generate a QR Code from the URL and generate a blob
		const qr = createQR(`solana:${qrcode}`);
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
			{!publicKey && <div className="mb-4">Please connect first! </div>}
			{publicKey && nftDeets && (
				<>
					<ReactCardFlip
						isFlipped={isImgFlip}
						flipDirection="horizontal"
						key="front"
					>
						<img
							src={nftDeets.image}
							className="rounded-3xl"
							style={{
								height: (windowSize.height || 100) / 2,
							}}
							onClick={flipCard}
						/>
						<img
							key="back"
							onClick={flipCard}
							src={qrCode}
							style={{
								position: "relative",
								background: "white",
							}}
							alt="QR Code"
							height={(windowSize.height || 100) / 2}
						/>
					</ReactCardFlip>

					{pDeets &&
						Object.entries(pDeets).map(([k, v]) => {
							if (!v || (v as string).length == 0) return;
							return (
								<div className="my-2">
									{k == "name" || k == "participant_id" ? (
										<span className="mr-2">{k}:</span>
									) : (
										<Link
											href={v as string}
											className=" text-my_blue  underline mr-2"
										>
											{k}:
										</Link>
									)}
									<span>{v as string}</span>
								</div>
							);
						})}
				</>
			)}
			<WalletMultiButton />
			{/*  Claims. For now just claiming event NFT. In future maybe can claim follow up event passes and prizes  */}
			{isOwner && !isEvtNFTClaimed && <div></div>}
		</div>
	);
}
