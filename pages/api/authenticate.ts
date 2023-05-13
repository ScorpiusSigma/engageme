import { NextApiRequest, NextApiResponse } from "next";
import {
	clusterApiUrl,
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	getOrCreateAssociatedTokenAccount,
	createTransferCheckedInstruction,
	getMint,
	TOKEN_PROGRAM_ID,
	getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
	GuestIdentityDriver,
	keypairIdentity,
	Metaplex,
} from "@metaplex-foundation/js";
import base58 from "bs58";

// Devnet 'fake' USDC, you can get these tokens from https://spl-token-faucet.com/
const MINT_ADDRESS = new PublicKey(
	"9pBcndZY6cbXSCqHemnmL3Aj74QERh4E2GdcMaDQz3GM"
);

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

async function takeAttendance(userAccount: PublicKey, orgAccount: PublicKey) {
	// Fetch the recent blockhash
	const connection = new Connection(ENDPOINT);
	const recentBlockhash = await connection.getLatestBlockhash();

	// Create a transaction instruction with a 0-lamport transfer
	const instruction = SystemProgram.transfer({
		fromPubkey: userAccount,
		toPubkey: orgAccount,
		lamports: 0,
	});

	// Create a transaction with the instruction
	const transaction = new Transaction().add(instruction);
	transaction.recentBlockhash = recentBlockhash.blockhash;
	transaction.feePayer = orgAccount;

	const serializedTransaction = transaction.serialize({
		requireAllSignatures: false,
	});

	const base64 = serializedTransaction.toString("base64");
	const message = "Please approve the transaction to take your attendance!";

	return {
		transaction: base64,
		message,
	}; // User has an NFT from the desired collection
}

async function isAttendanceTaken(
	userAccount: PublicKey,
	orgAccount: PublicKey
) {
	const LIMIT = 15;
	const connection = new Connection(ENDPOINT);
	const recentBlockhash = await connection.getLatestBlockhash();

	connection
		.getConfirmedSignaturesForAddress2(userAccount)
		.then(async (signatures) => {
			const filterSignatures = signatures.filter(
				(x, index) => index < LIMIT
			);

			for (const signature of filterSignatures) {
				// Get the confirmed transaction details
				const transaction = await connection.getConfirmedTransaction(
					signature.signature
				);

				if (transaction) {
					// Access the recipient's public key
					const recipientPublicKey = transaction.transaction;
					const blockTime = transaction.blockTime;

					if (blockTime) {
						const transactionTime = unixTimestampToDate(blockTime);
						console.log("Transaction Time:", transactionTime);

						if (
							/**
							 * Needs a better way to check if this transaction is attendance taking.
							 * Right now the check is just checking if the fee payer is the orgniser
							 * */
							recipientPublicKey.feePayer?.equals(orgAccount) &&
							isToday(transactionTime)
						) {
							return true;
						}
					}
				}
			}
		});

	return false;
}

function unixTimestampToDate(timestamp: number): Date {
	return new Date(timestamp * 1000);
}

function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getDate() >= today.getDate() &&
		date.getMonth() >= today.getMonth() &&
		date.getFullYear() >= today.getFullYear()
	);
}

async function postImpl(
	userAccount: PublicKey,
	mintAccount: PublicKey,
	orgAccount: PublicKey
): Promise<PostResponse> {
	if (await isAttendanceTaken(userAccount, orgAccount)) {
		return {
			transaction: "Not SIU",
			message: "Attendance already taken!",
		}; // User has an NFT from the desired collection
	}
	const connection = new Connection(ENDPOINT);
	const metaplex = new Metaplex(connection);

	// 1. Fetch the user's token accounts
	const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
		userAccount,
		{
			programId: TOKEN_PROGRAM_ID,
		}
	);

	// 2. Check if any of the token accounts belong to the desired collection address.
	for (const account of tokenAccounts.value) {
		// 2a. Get NFT token address.
		const tokenAddress = account.account.data.parsed.info.mint;

		// 2b. Get NFT details with Metaplex.
		const nft = await metaplex
			.nfts()
			.findByMint({ mintAddress: new PublicKey(tokenAddress) });

		// 2c. Get the collection address and verification.
		const mintAddress = nft.collection?.address.toString();
		const isVerified = nft.collection?.verified;

		// 2d. Check if the collection address is the correct one and if it is verified.
		if (mintAddress === mintAccount.toString() && isVerified) {
			return await takeAttendance(userAccount, orgAccount);
		}
	}

	return {
		transaction: "Not SIU",
		message: "You dont have a valid NFT",
	}; // User has an NFT from the desired collection
}

async function post(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	const { account } = req.body as InputData;
	const { mintAccount, orgAccount } = req.query;

	if (!account) {
		res.status(400).json({ error: "No account provided" });
		return;
	}

	if (!mintAccount) {
		res.status(400).json({ error: "No token account provided" });
		return;
	}

	if (!orgAccount) {
		res.status(400).json({ error: "No token organiser account provided" });
		return;
	}

	try {
		const mintOutputData = await postImpl(
			new PublicKey(account),
			new PublicKey(mintAccount),
			new PublicKey(orgAccount)
		);
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
