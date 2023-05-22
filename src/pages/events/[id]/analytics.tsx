import ClaimGraph from "@/components/ClaimGraph";
import DailyAttenGraph from "@/components/DailyAttenGraph";
import Navbar from "@/components/Navbar/Navbar";
import router from "next/router";
import { useEffect, useState } from "react";



export default function AnalyticsPage() {
    const [attenMetric, setAttenMetrics] = useState<any[] | undefined>(undefined);
    const [dailyTotal, setDailyTotal] = useState<any[] | undefined>(undefined);

    const [pCnt, setPCnt] = useState<number | undefined>();
    const [claimCnt, setClaimCnt] = useState<number | undefined>();

    const fetchParticipantsByEvent = async () => {
        const { id } = router.query;

        const res = await fetch(`/api/events/${id}/participants`);
        if (res.status != 200) {
            return;
        }
        let data = await res.json();

        setPCnt(data.length)
        setClaimCnt(data.filter((el: any) => {
            return 'wallet_addr' in el && el.wallet_addr.length > 0
        }).length)

    };

    const fetchAttendanceMetric = async () => {
        const res = await fetch(`/api/get-attendance-metric?isAgg=false`);
        if (res.status != 200) {
            return
        }
        setAttenMetrics((await res.json()).data)
    }

    const fetchAttenAgg = async () => {
        const res = await fetch(`/api/get-attendance-metric?isAgg=true`);
        if (res.status != 200) {
            return
        }
        setDailyTotal((await res.json()).data)
    }

    useEffect(() => {
        fetchAttendanceMetric()
        fetchAttenAgg()
        fetchParticipantsByEvent()
    }, [])

    return (
        <div className="h-screen w-full bg-slate-100 dark:bg-slate-800 dark:text-white font-robo relative">
            <Navbar />

            <div className="relative pt-16 mx-4">
                <div className="flex justify-between items-center">
                    {dailyTotal != undefined ? (
                        <DailyAttenGraph width={600} height={400} data={dailyTotal} className="" />
                    ) : (
                        <div> No attendance taken yet </div>
                    )}
                    {
                        pCnt != undefined && claimCnt != undefined && (
                            <div className=" w-1/2 h-1/2"
                                style={{
                                    width: 400,
                                    height: 400
                                }}
                            >
                                <ClaimGraph data={
                                    [
                                        {
                                            name: "Not Claimed", value: 10//pCnt-claimCnt
                                        },
                                        {
                                            name: "Claimed", value: 10// claimCnt
                                        }
                                    ]
                                } />
                            </div>
                        )
                    }
                    {/* claaiums <div>{pCnt-claimCnt}</div>
                    <div>{claimCnt}</div> */}

                </div>
            </div>


        </div>
    )
}