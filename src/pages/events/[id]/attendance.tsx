import { useQRCode } from "next-qrcode";

import { createQR } from "@solana/pay";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function AttendancePage() {
  const [status, setStatus] = useState<string>();
  const [qrCode, setQrCode] = useState<string>();
  const [reference, setReference] = useState<string>();

  const { publicKey } = useWallet();

  const getQrCode = async () => {
    let params = JSON.stringify({
      account: publicKey,
      wallet: publicKey,
      token: "1",
      mintAccount: "1",
      orgAccount: "1",
    });

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
    if (!publicKey) {
      setStatus("Please log in to your solana wallet first :)");
      return;
    }
    getQrCode();
  }, [publicKey]);

  // should be mobile responsive
  return (
    <div className=" flex justify-center items-center h-screen flex-col">
      {qrCode && (
        <Image
          src={qrCode}
          style={{ position: "relative", background: "white" }}
          alt="QR Code"
          width={200}
          height={200}
          priority
        />
      )}
      <div>{status}</div>
      <WalletMultiButton />
    </div>
  );
}
