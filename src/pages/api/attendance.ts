import { NextApiRequest, NextApiResponse } from "next";
import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
	createHashAuth,
	ENDPOINT,
	generateQrCodeLink,
	getBaseUrl,
	getMintAddressOfToken,
} from "@/utils";
import { Metaplex } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createHash } from "crypto";

// Hashed Secret Key
const HashedSecretKey = [
	"e713a29828d88cc011d20a83855341f32f0881e86d4237e88e6c020e5c8b94d6",
	"417bd1998718342b9e4483689696f1a3c19ab449bc14390d95ee171c6ce43763",
	"b90ea44e2cafcab0da4938d865574e507a1cb58c049bef1593ddec574925623a",
	"0784b50bccb32cac4f58cf69c2fc66d1fa5e34fa6660172e13ddae1cab88bf65",
	"2d05b448f70ab745ffc834e59b1766263e1801afee95168d8ea40c2d725161b2",
	"f0578e904ba447ba2648ef9ea8aa053b75d1f5f539578f5e8a13812139ac4146",
	"4e6efc43409b0592b4fafc64f9d4be1f598dbea14e37bc072a51502874cb2009",
	"eea7c3ae92bb4359d8b162a2115b82df8470cca4c9d8f0149d9752a9e0f5dc2e",
];

type InputData = {
	account: string;
	wallet: string;
	token: string;
	mintAccount: string;
	orgAccount: string;
};

type GetResponse = {
	label: string;
	icon: string;
};

export type PostResponse = {
	qrcode: string;
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

function createHashKey(orgAccount: PublicKey): string {
	const today = new Date();
	const dateString =
		today.getDate() +
		"" +
		today.getMonth() +
		"" +
		today.getFullYear() +
		"" +
		orgAccount.toString(); // Convert date to string
	const hash = createHash("sha256"); // Create SHA-256 hash object
	hash.update(dateString); // Update the hash with the string
	return hash.digest("hex"); // Get the hexadecimal representation of the hash
}


async function post(
	req: NextApiRequest,
	res: NextApiResponse<PostResponse | PostError>
) {
	console.log(req.body)
	const { account, token, orgAccount } = req.body as InputData;
	console.log(`Account: ${account} token: ${token} orgAccount: ${orgAccount}`)
	if (!orgAccount) {
		res.status(400).json({ error: "No organizer account provided" });
		return;
	}

	if (!account) {
		res.status(400).json({ error: "No wallet provided" });
		return;
	}

	if (!token) {
		res.status(400).json({ error: "No token provided" });
		return;
	}

	try {
		const response = {
			qrcode: generateQrCodeLink(
				getBaseUrl(req),
				new PublicKey(account),
				new PublicKey(token),
				new PublicKey(
					await getMintAddressOfToken(new PublicKey(token))
				),
				new PublicKey(orgAccount)
			),
		};

		res.status(200).json(response);
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
	console.log("Attendance")
	if (req.method === "POST") {
		return await post(req, res);
	} else {
		return res.status(405).json({ error: "Method not allowed" });
	}
}
