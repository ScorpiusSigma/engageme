import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Image from 'next/image';
import React, { useEffect } from 'react';
import styles from '../styles/Home.module.css';
import Navbar from '@/components/Navbar/Navbar';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
// import Navbar from '@/components/Navbar/Navbar';

// const WalletDisconnectButtonDynamic = dynamic(
//     async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
//     { ssr: false }
// );
// const WalletMultiButtonDynamic = dynamic(
//     async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
//     { ssr: false }
// );

const Home: NextPage = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const router = useRouter();

    useEffect(()=>{
        if( !publicKey) return;
        router.push("/events");
    },[publicKey])

    return (
        <div className="h-screen w-full bg-white dark:bg-slate-800 dark:text-white font-robo">
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
                <Navbar />
                <div className='flex items-center justify-center h-full'>
                    {!publicKey ? (
                        <div>
                            Please connect your wallet at the top right!
                        </div>
                    ) : (<div>
                        {`Welcome ${publicKey}!`}
                    </div>)}
                </div>

            {/* <footer className={styles.footer}>
                <a
                    href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by{' '}
                    <span className={styles.logo}>
                        <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
                    </span>
                </a>
            </footer> */}
        </div>
    );
};

export default Home;