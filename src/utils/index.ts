import { PublicKey, token } from "@metaplex-foundation/js";
import { createHash } from "crypto";

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
	return `${host}/api/attendace-auth?hash=${hash}&wallet=${walletAddress.toString()}&token=${tokenAddress.toString()}&mintAccount=${mintAccount}&orgAccount=${orgAccount}`;
};
