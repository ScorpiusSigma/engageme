import {
	DynamoDBClient,
	GetItemCommand,
	ScanCommand,
} from "@aws-sdk/client-dynamodb";
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

export const ddbClient = new DynamoDBClient({});

export const ddbTables = {
	evt: "events",
	evt_part: "evt_participant",
	atten: "evt_attendance_taker",
};

export const tableCellStyle = " p-4 border-b border-gray-200 text-left ";

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
	walletAddress: PublicKey,
	tokenAddress: PublicKey,
	mintAccount: PublicKey,
	eventId: string
): string => {
	const hash = createHashAuth(walletAddress, tokenAddress);
	return (
		"solana:" +
		encodeURIComponent(
			`${
				process.env.BASE_URL
			}/api/attendance-auth?hash=${hash}&wallet=${walletAddress.toString()}&token=${tokenAddress.toString()}&mintAccount=${mintAccount}&orgAccount=${ORG_ACCOUNT}&eventId=${eventId}`
		)
	);
};

export const isValidWallet = (wallet: PublicKey) => {
	// Check the db if its inside
};

export async function isValidAttendanceTaker(
	e_id: string,
	account: PublicKey
): Promise<boolean> {
	let res;

	switch (process.env.BASE_URL) {
		case undefined:
			res = await fetch(`/api/events/${e_id}/is_atten_taker`, {
				method: "POST",
				body: JSON.stringify({
					publicKey: account,
				}),
				headers: new Headers({
					"Content-Type": "application/json",
					Accept: "application/json",
				}),
			});
			break;
		default:
			res = await fetch(
				`${process.env.BASE_URL}/api/events/${e_id}/is_atten_taker`,
				{
					method: "POST",
					body: JSON.stringify({
						publicKey: account,
					}),
					headers: new Headers({
						"Content-Type": "application/json",
						Accept: "application/json",
					}),
				}
			);
	}

	if (res.status != 200) {
		return false;
	}

	return (await res.json()).is_attendance_taker;
}

export async function takeAttendance(
	event_id: any,
	attendaceTakerAccount: PublicKey,
	userAccount: PublicKey
) {
	if (!(await isValidAttendanceTaker(event_id, attendaceTakerAccount))) {
		return {
			error: "Attedance Taker is not using a valid wallet! Please contact organiser",
		};
	}

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
	transaction.feePayer = new PublicKey(ORG_ACCOUNT);

	transaction.partialSign(getKeypair());

	const serializedTransaction = transaction.serialize({
		requireAllSignatures: false,
	});

	const base64 = serializedTransaction.toString("base64");
	const message = "Take attendance by approving transaction!";

	return {
		transaction: base64,
		message,
	};
}

export async function isAttendanceTaken(userAccount: PublicKey) {
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

						if (
							/**
							 * TODO: Needs a better way to check if this transaction is attendance taking.
							 * Right now the check is just checking if the fee payer is the orgniser
							 * */
							recipientPublicKey.feePayer?.equals(
								new PublicKey(ORG_ACCOUNT)
							) &&
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

export async function getUnclaimedNfts(e_id: string) {
	// get orgProxy by e_id first
	let res = await fetch(`/api/events/${e_id}/get_org_proxy`);
	if (res.status != 200) {
		return null;
	}
	const orgProxy: PublicKey = (await res.json()).orgProxy;

	return await getNftsOfWallet(orgProxy);
}

export async function getNftsOfWallet(wallet: PublicKey) {
	const connection = new Connection(ENDPOINT);
	const metaplex = new Metaplex(connection);

	// 1. Fetch the user's token accounts
	const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
		wallet,
		{
			programId: TOKEN_PROGRAM_ID,
		}
	);
	let tokenAddrs = tokenAccounts.value.map(({ account }) => {
		return account.data.parsed.info.mint;
	});
	return tokenAddrs;
}

// I think can use my check if nft is owner code instead of this O(n) method
export async function isRedeemedWallet(
	recvWallet: PublicKey,
	tokenPK: PublicKey
) {
	return recvWallet.toString() === (await getNFTOwnerWallet(tokenPK));
}

export async function isRedeemed(tokenAddress: PublicKey) {
	return (await getNFTOwnerWallet(tokenAddress)) !== ORG_ACCOUNT;
}

export async function getNFTOwnerWallet(tokenAddress: PublicKey) {
	const connection = new Connection(ENDPOINT);
	const tokenMint = tokenAddress;
	const largestAccounts = await connection.getTokenLargestAccounts(
		new PublicKey(tokenMint)
	);
	const largestAccountInfo = await connection.getParsedAccountInfo(
		largestAccounts.value[0].address
	);

	let owner = (largestAccountInfo?.value?.data as any).parsed.info.owner;
	return owner;
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
	return nft;
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
		return new Keypair();
	}
	const keypair = Keypair.fromSecretKey(
		base58.decode(process.env.COLLECTION_OWNER_PRIVATE_KEY)
	);

	return keypair;
};

export const getTokenAddrFromDB = async (e_id: string, uuid: string) => {
	let res;

	switch (process.env.BASE_URL) {
		case undefined:
			res = await fetch(`/api/events/${e_id}/${uuid}`);
			break;
		default:
			res = await fetch(
				`${process.env.BASE_URL}/api/events/${e_id}/${uuid}`
			);
	}

	if (res.status != 200) {
		return "";
	}
	return (await res.json()).evt_token_addr;
};

export async function redeem(
	e_id: string,
	p_id: string,
	recvWallet: PublicKey
) {
	const MINT = (await getTokenAddrFromDB(e_id, p_id)).S; //"Aio6LF739QngJKVW98yBHqqaS8SVBugK6kb6Q3AJTyAm";
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

	await sendAndConfirmTransaction(
		connection,
		transaction,
		[collectionOwnerKeypair],
		{ commitment: "finalized" }
	);

	const message = `NFT of ${mintPublicKey} has been transferred to ${receiverTokenAccount.address}`;

	console.log(message);
	return {
		message,
	};
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
						const receivingTokenAccount = (
							transaction.transaction.message
								.instructions[0] as any
						)?.parsed?.info?.destination;

						if (!receivingTokenAccount) {
							continue;
						}

						const receivingTokenAccountInfo = (
							(
								await connection.getParsedAccountInfo(
									new PublicKey(receivingTokenAccount)
								)
							)?.value?.data as any
						)?.parsed?.info?.owner;

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

export const justDate = (date: Date) => {
	return date.toISOString().substring(0, 10);
};

export const aggAttendanceMetric = (
	data: {
		datetime: Date;
		account: string;
	}[]
) => {
	return Object.entries(
		data
			.map((el) => {
				return justDate(el.datetime); //toLocaleDateString()
			})
			.reduce((pv: any, cv: string) => {
				if (!pv.hasOwnProperty(cv)) {
					pv[cv] = 0;
				}
				pv[cv] += 1;
				return pv;
			}, {})
	)
		.map(([k, v]: [any, any]) => {
			// console.log(`k: ${k}`)
			return {
				dateString: k,
				date: new Date(k).getTime(),
				count: v,
			};
		})
		.sort((a, b) => {
			if (a.date > b.date) {
				return 1;
			}

			if (a.date < b.date) {
				return -1;
			}
			return 0;
		});
};

export const getParticipantByEidPK = async (
	e_id: string,
	publicKey: string
): Promise<{ participant_id: string }> => {
	const client = ddbClient;
	const { Items } = await client.send(
		new ScanCommand({
			TableName: ddbTables.evt_part,
			FilterExpression: "#eid = :e_id and #pk = :pk_value",
			ExpressionAttributeNames: {
				"#pk": "wallet_addr",
				"#eid": "event_id",
			},
			ExpressionAttributeValues: {
				":e_id": {
					S: e_id,
				},
				":pk_value": {
					S: publicKey,
				},
			},
		})
	);
	const toRet = (Items as any)[0];
	return toRet;
};

export const airdrop = async (e_id: string, recvWallets: PublicKey[]) => {
	const connection = new Connection(ENDPOINT);
	const collectionOwnerKeypair = getKeypair();

	console.log(`airdrop: ${recvWallets}`);

	for (const recvWallet of recvWallets) {
		const tmp = await fetch(
			`/api/events/${e_id}/participants?wallet_addr=${recvWallet}`
		);
		if (tmp.status != 200) throw Error;

		const { participant_id } = await tmp.json();
		console.log(`${participant_id} has wallet ${recvWallet}`);

		const MINT = (await getTokenAddrFromDB(e_id, participant_id)).S; //"Aio6LF739QngJKVW98yBHqqaS8SVBugK6kb6Q3AJTyAm";

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

		const res = await sendAndConfirmTransaction(
			connection,
			transaction,
			[collectionOwnerKeypair],
			{ commitment: "finalized" }
		);

		const message = `NFT of ${mintPublicKey} has been transferred to ${receiverTokenAccount.address}`;
		console.log(message);
	}
};
