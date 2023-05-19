import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Metaplex, PublicKey, token } from "@metaplex-foundation/js";
import {
	TOKEN_PROGRAM_ID,
	createTransferInstruction,
	getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
	Connection,
	Keypair,
	SystemProgram,
	Transaction,
	clusterApiUrl,
	sendAndConfirmTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import { createHash } from "crypto";
import { NextApiRequest } from "next";

export const ENDPOINT = clusterApiUrl("devnet");
export const MINT_ACCOUNT = "3qQ2nNoyKtgwgZQ9M9YW4LykE6k4mHd1atSbMUJP124z";
export const ORG_ACCOUNT = "9uNgWMGhiGwMddgwgyE8T5FBTA4kZE4ry7bUxvVtnxor";

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

export const createHashAuth = (
	walletAddress: PublicKey,
	tokenAddress: PublicKey
): string => {
	const today = new Date();

	const date = today.getDate();
	const month = today.getMonth();
	const year = today.getFullYear();

	const hashBuilder =
		date +
		tokenAddress.toString() +
		month +
		walletAddress.toString() +
		year;

	const hash = createHash("sha256"); // Create SHA-256 hash object
	hash.update(hashBuilder);
	return hash.digest("hex"); // Get the hexadecimal representation of the hash
};

export const generateQrCodeLink = (
	host: string,
	walletAddress: PublicKey,
	tokenAddress: PublicKey,
	mintAccount: PublicKey,
	orgAccount: PublicKey
): string => {
	const hash = createHashAuth(walletAddress, tokenAddress);
	return `${host}/api/attendance-auth?hash=${hash}&wallet=${walletAddress.toString()}&token=${tokenAddress.toString()}&mintAccount=${mintAccount}&orgAccount=${orgAccount}`;
};

export const isValidWallet = (wallet: PublicKey) => {
	// Check the db if its inside
};

export async function takeAttendance(
	attendaceTakerAccount: PublicKey,
	userAccount: PublicKey,
	orgAccount: PublicKey
) {
	// Fetch the recent blockhash
	const connection = new Connection(ENDPOINT);
	const recentBlockhash = await connection.getLatestBlockhash();

	// Create a transaction instruction with a 0-lamport transfer
	const instruction = SystemProgram.transfer({
		fromPubkey: attendaceTakerAccount,
		toPubkey: userAccount,
		lamports: 0,
	});

	// Create a transaction with the instruction
	const transaction = new Transaction().add(instruction);
	transaction.recentBlockhash = recentBlockhash.blockhash;
	transaction.feePayer = orgAccount;

	transaction.partialSign(getKeypair());

	const serializedTransaction = transaction.serialize({
		requireAllSignatures: false,
	});

	const base64 = serializedTransaction.toString("base64");
	const message = "Please approve the transaction to take your attendance!";

	return {
		transaction: base64,
		message,
	};
}

export async function isAttendanceTaken(
	userAccount: PublicKey,
	orgAccount: PublicKey
) {
	const LIMIT = 15;
	const connection = new Connection(ENDPOINT);

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
							 * TODO: Needs a better way to check if this transaction is attendance taking.
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

export async function isRedeemed(recvWallet: PublicKey) {
	const connection = new Connection(ENDPOINT);
	const metaplex = new Metaplex(connection);

	// 1. Fetch the user's token accounts
	const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
		recvWallet,
		{
			programId: TOKEN_PROGRAM_ID,
		}
	);

	// 2. Check if any of the token accounts belong to the desired collection address.
	for (const account of tokenAccounts.value) {
		// 2a. Get NFT token address.
		const tokenAddress = account.account.data.parsed.info.mint;

		let nft;
		// 2b. Get NFT details with Metaplex.
		try {
			nft = await metaplex
				.nfts()
				.findByMint({ mintAddress: new PublicKey(tokenAddress) });
		} catch (e) {
			continue;
		}

		// 2c. Get the collection address and verification.
		const mintAddress = nft?.collection?.address.toString();
		const isVerified = nft?.collection?.verified;

		// 2d. Check if the collection address is the correct one and if it is verified.
		if (mintAddress === MINT_ACCOUNT && isVerified) {
			return true;
		}
	}

	return false;
}

export async function getNFTFromToken(tokenAddress: PublicKey) {
	const connection = new Connection(ENDPOINT);
	const metaplex = new Metaplex(connection);

	let nft;
	try {
		nft = await metaplex
			.nfts()
			.findByMint({ mintAddress: new PublicKey(tokenAddress) });
	} catch (e) {
		return "";
	}
	return nft
}

export async function getMintAddressOfToken(tokenAddress: PublicKey) {
	const connection = new Connection(ENDPOINT);
	const metaplex = new Metaplex(connection);

	let nft;
	// 2b. Get NFT details with Metaplex.
	try {
		nft = await metaplex
			.nfts()
			.findByMint({ mintAddress: new PublicKey(tokenAddress) });
	} catch (e) {
		return "";
	}

	// 2c. Get the collection address and verification.
	const mintAddress = nft?.collection?.address.toString();
	return mintAddress || "";
}

const getKeypair = (): Keypair => {
	// Collection owner keypair
	if (!process.env.COLLECTION_OWNER_PRIVATE_KEY) {
		console.log("COLLECTION_OWNER_PRIVATE_KEY not found!");
		return new Keypair();
	}
	const keypair = Keypair.fromSecretKey(
		base58.decode(process.env.COLLECTION_OWNER_PRIVATE_KEY)
	);

	return keypair;
};

export async function redeem(recvWallet: PublicKey) {
	// This will be the token address of the NFT
	const MINT = "Aio6LF739QngJKVW98yBHqqaS8SVBugK6kb6Q3AJTyAm";

	// connection
	const connection = new Connection(ENDPOINT);

	const collectionOwnerKeypair = getKeypair();

	const mintPublicKey = new PublicKey(MINT);
	const ownerPublicKey = collectionOwnerKeypair.publicKey;
	const destPublicKey = recvWallet;

	const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		collectionOwnerKeypair,
		mintPublicKey,
		ownerPublicKey
	);

	const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		collectionOwnerKeypair,
		mintPublicKey,
		destPublicKey
	);

	const instruction = createTransferInstruction(
		senderTokenAccount.address,
		receiverTokenAccount.address,
		ownerPublicKey,
		1,
		[collectionOwnerKeypair]
	);

	const transaction = new Transaction().add(instruction);

	return await sendAndConfirmTransaction(connection, transaction, [
		collectionOwnerKeypair,
	]);
}

export function getBaseUrl(req: NextApiRequest) {
	return (
		req.headers.referer
			?.split("/")
			.filter((x, index) => index < 3)
			.join("/") || ""
	);
}

export function getAttendanceMetric() {
	const account = new PublicKey(ORG_ACCOUNT);
	const connection = new Connection(ENDPOINT);

	const metric = connection
		.getConfirmedSignaturesForAddress2(account)
		.then(async (signatures) => {
			let metric = [];

			const filterSignatures = signatures.filter(
				(x, index) => index < 15
			);

			for (const signature of filterSignatures) {
				// Get the confirmed transaction details
				const transaction = await connection.getParsedTransaction(
					signature.signature
				);

				if (transaction) {
					// Access the recipient's public key
					const recipientPublicKey = transaction.transaction;
					const blockTime = transaction.blockTime;

					if (blockTime) {
						const receivingTokenAccount =
							transaction.transaction.message.instructions[0]
								?.parsed?.info?.destination;

						if (!receivingTokenAccount) {
							continue;
						}

						const receivingTokenAccountInfo = (
							await connection.getParsedAccountInfo(
								new PublicKey(receivingTokenAccount)
							)
						)?.value?.data?.parsed?.info?.owner;

						if (!receivingTokenAccountInfo) {
							continue;
						}

						const receivingAccount = new PublicKey(
							receivingTokenAccountInfo
						);

						const transactionTime = unixTimestampToDate(blockTime);

						if (!receivingAccount.equals(account)) {
							metric.push({
								datetime: transactionTime,
								account: receivingAccount.toString(),
							});
						}
					}
				}
			}

			return metric;
		});

	return metric;
}


export const ddbClient = new DynamoDBClient({});

export const ddbTables = {
	evt: "events",
	evt_part: "evt_participant",
	atten: "evt_attendance_taker"
}

export const tableCellStyle  = " p-4 border-b border-gray-200 text-left "