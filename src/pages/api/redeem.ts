/**
 * #TODO: check is datetime is enabled for redemption
 * Check how many time this link has been hit before redemption
 * uuid map to NFT
 *
 * User will have the qr generated on their website and organiser will scan with their phone to verify the user
 *
 * 24032023faoisjfneljnvpaidsuhnr
 *  */

import { NextApiRequest, NextApiResponse } from "next";
import {
	clusterApiUrl,
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import base58 from "bs58";
import {
	TOKEN_PROGRAM_ID,
	createTransferCheckedInstruction,
	getMint,
	getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { GuestIdentityDriver } from "@metaplex-foundation/js";

// Mainnet USDC, uncomment if using mainnet
// const USDC_ADDRESS = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

// Connection endpoint, switch to a mainnet RPC if using mainnet
const ENDPOINT = clusterApiUrl("devnet");

type InputData = {
	account: string;
};

type GetResponse = {
	label: string;
	icon: string;
};

export type PostResponse = {
	transaction: string;
	message: string;
};

export type PostError = {
	error: string;
};

function get(res: NextApiResponse<GetResponse>) {
	res.status(200).json({
		label: "Builders League",
		icon: "https://solana.com/src/img/branding/solanaLogoMark.svg",
	});
}

async function postImpl(account: PublicKey): Promise<PostResponse> {
	const connection = new Connection(ENDPOINT);

	// Get the sender's account
	const collectionOwnerPrivateKey = process.env.COLLECTION_OWNER_PRIVATE_KEY;
	if (!collectionOwnerPrivateKey) {
		throw new Error("COLLECTION_OWNER_PRIVATE_KEY not found");
	}
	const collectionOwnerKeypair = Keypair.fromSecretKey(
		base58.decode(collectionOwnerPrivateKey)
	);

	// Define the sender and receiver public keys
	const senderPubKey = collectionOwnerKeypair.publicKey;
	const receiverPubKey = new PublicKey(account);

	// Define the NFT mint address
	// This address will be take from the database
	const nftMintPubKey = new PublicKey(
		"Aio6LF739QngJKVW98yBHqqaS8SVBugK6kb6Q3AJTyAm"
	);

	// Get the collection owner's NFT address
	const senderNftAddress = await getOrCreateAssociatedTokenAccount(
		connection,
		collectionOwnerKeypair,
		nftMintPubKey,
		senderPubKey
	);

	// Get the receiver's NFT address
	const receiverNftAddress = await getOrCreateAssociatedTokenAccount(
		connection,
		collectionOwnerKeypair,
		nftMintPubKey,
		receiverPubKey
	);

	const nftMint = await getMint(connection, nftMintPubKey);
	const decimals = nftMint.decimals;

	const nftTransferInstruction = createTransferCheckedInstruction(
		senderNftAddress.address, // from nft address
		nftMint.address, // nft mint address
		receiverNftAddress.address, // to nft address
		senderNftAddress.address, // owner of the from USDC address (the buyer)
		1 * 10 ** decimals, // multiply by 10^decimals
		decimals
	);

	// // Create a transaction instruction with a 0-lamport transfer
	const instruction = SystemProgram.transfer({
		fromPubkey: receiverPubKey,
		toPubkey: senderPubKey,
		lamports: 0,
	});

	// Create a new Transaction
	const transaction = new Transaction()
		.add(nftTransferInstruction)
		.add(instruction);
	const recentBlockhash = await connection.getLatestBlockhash();
	transaction.recentBlockhash = recentBlockhash.blockhash;
	transaction.feePayer = senderPubKey;

	// Partially sign the transaction, as the shop and the mint
	// The account is also a required signer, but they'll sign it with their wallet after we return it
	transaction.partialSign(collectionOwnerKeypair);

	const serializedTransaction = transaction.serialize({
		requireAllSignatures: false,
		verifySignatures: false,
	});

	const base64 = serializedTransaction.toString("base64");
	const message = "Please approve the transaction to mint ticket NFT!";

	// Return the serialized transaction
	return {
		transaction: base64,
		message,
	};
}

async function post(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	const { account } = req.body as InputData;

	if (!account) {
		res.status(400).json({ error: "No account provided" });
		return;
	}

	try {
		const mintOutputData = await postImpl(new PublicKey(account));
		res.status(200).json(mintOutputData);
		return;
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "error creating transaction" });
		return;
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
	if (req.method === "GET") {
		return get(res);
	} else if (req.method === "POST") {
		return await post(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}

/**
 * User will scan ban to redeem the NFT
 * User will scan QR code to authenticate/take attendance
 *
 */
