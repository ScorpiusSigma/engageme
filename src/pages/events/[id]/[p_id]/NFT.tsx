import useWindowSize from "@/hooks/WindowResize";
import {
	getNFTFromToken,
	getNFTOwnerWallet,
	getTokenAddrFromDB,
	isRedeemed,
} from "@/utils";
import { PublicKey } from "@metaplex-foundation/js";
import { Height } from "@mui/icons-material";
import { createQR } from "@solana/pay";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
	const [isOwner, setIsOwner] = useState(false);
	const [isEvtNFTClaimed, setIsEvtNFTClaimed] = useState(false);
	const [pDeets, setPDeets] = useState<any>(null);
	const [nftDeets, setNFTDeets] = useState<any>(null);
	const [tokenAddress, setTokenAddress] = useState<string>("");
	const [loading, setLoading] = useState(false);
	let orgAddr = "";
	// const [orgAddr, setOrgAddr] = useState<string>("");

	const [isImgFlip, setImgFlip] = useState(false);
	const [status, setStatus] = useState<string>();
	const [qrCode, setQrCode] = useState<string>();

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
		console.log("res", data);
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
		setNFTDeets(nft.json);

		const owner = await getNFTOwnerWallet(token_addr);
		if (owner == publicKey) {
			setIsOwner(true);
			await fetchOrganiser(id as string);
			getQrCode(part_data);
		}
	};

	const flipCard = () => {
		if (!isOwner) {
			console.log("You are not the owner");
			return;
		}

		setImgFlip(!isImgFlip);
	};

	const getSocialsIcon = (social: string) => {
		switch (social) {
			case "github":
				return (
					<Image
						src={"/github_icon.png"}
						alt="Github Logo"
						width={50}
						height={50}
					/>
				);
			case "insta":
				return (
					<Image
						src={"/instagram_icon.png"}
						alt="Github Logo"
						width={50}
						height={50}
					/>
				);
			case "linkedin":
				return (
					<Image
						src={"/linkedin_icon.png"}
						alt="Github Logo"
						width={50}
						height={50}
					/>
				);
			case "twitter":
				return (
					<Image
						src={"/twitter_icon.png"}
						alt="Github Logo"
						width={50}
						height={50}
					/>
				);
			default:
				break;
		}
	};

	const getQrCode = async (part_data: any) => {
		// console.log(pDeets)
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

	useEffect(() => {
		if (!router.isReady || !publicKey) return;
		const { id, p_id } = router.query;

		checkEvtRedeemed(id, p_id);

		let miao = fetchParticipant(id as string, p_id as string);
		miao.then(fetchNFT);
		miao.then(setPDeets);
	}, [router.isReady, publicKey]);

	const checkEvtRedeemed = async (e_id: any, p_id: any) => {
		const tokenAddress = (await getTokenAddrFromDB(e_id, p_id)) || "";
		setTokenAddress(tokenAddress.S);
		try {
			setIsEvtNFTClaimed(await isRedeemed(new PublicKey(tokenAddress.S)));
		} catch {
			return false;
		}
	};

	const redeemNft = async () => {
		setLoading(true);

		const { p_id, id } = router.query;

		await fetch(`/api/${id}/${p_id}/redeem`, {
			method: "POST",
			body: JSON.stringify({
				account: publicKey,
				tokenAddress: tokenAddress,
			}),
		});

		setTimeout(() => {
			location.reload();
		}, 5000);
	};

	return (
		<div className="flex flex-col items-center pt-20 h-screen w-full">
			{!publicKey && <div className="mb-4">Please connect first! </div>}
			{publicKey && nftDeets && isEvtNFTClaimed && (
				<>
					<div className="p-5 flex justify-center items-center w-full h-1/2">
						<div className="flex justify-center items-center w-max h-full">
							<ReactCardFlip
								isFlipped={isImgFlip}
								flipDirection="horizontal"
								key="front"
								containerStyle={{
									height: "100%",
									width: "100%",
								}}
							>
								<img
									src={nftDeets.image}
									className="rounded-3xl h-full"
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
									className="rounded-3xl h-full"
								/>
							</ReactCardFlip>
						</div>
					</div>
					<div className="w-full flex flex-col items-center">
						<div className="flex flex-col items-center">
							<p className="font-bold text-2xl">{pDeets.name}</p>
							<p className="text-lg">{pDeets.role}</p>
						</div>
						<div className="flex flex-row gap-2 pt-2">
							{pDeets &&
								Object.entries(pDeets).map(([k, v]) => {
									if (
										!v ||
										(v as string).length == 0 ||
										!(v as string).includes("http")
									)
										return;
									return (
										<div className="my-2">
											{
												<Link
													target="_blank"
													href={v as string}
													className=" text-my_blue  underline mr-2"
												>
													{getSocialsIcon(k)}
												</Link>
											}
										</div>
									);
								})}
						</div>
					</div>
				</>
			)}
			{publicKey && nftDeets && !isEvtNFTClaimed && (
				<div className="flex flex-col items-center mb-10">
					<div className="p-5 flex justify-center items-center">
						<div className="flex justify-center items-center">
							<img
								src={nftDeets?.image}
								className="rounded-3xl h-full"
							/>
						</div>
					</div>
					<button
						className="bg-[#512da8] text-white text-base px-5 py-2 rounded-md m1 active:bg-[#2c2d30] hover:bg-[#2c2d30]"
						onClick={redeemNft}
					>
						{loading ? "Redeeming..." : "Redeem"}
					</button>
				</div>
			)}
			<WalletMultiButton />
			{/*  Claims. For now just claiming event NFT. In future maybe can claim follow up event passes and prizes  */}
			{/* {isOwner && !isEvtNFTClaimed && <div></div>} */}
		</div>
	);
}
