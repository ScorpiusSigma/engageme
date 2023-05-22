import ClaimGraph from "@/components/ClaimGraph";
import DailyAttenGraph from "@/components/DailyAttenGraph";
import Navbar from "@/components/Navbar/Navbar";
import { tableCellStyle } from "@/utils";
import router from "next/router";
import { useEffect, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

import FilterListIcon from '@mui/icons-material/FilterList';
import { FormControl, IconButton, InputLabel, MenuItem, Select } from "@mui/material";

enum TableMode {
    daily,
    dayRange
}

const FilterMenu = ({mode}: {
    mode: TableMode
}) => {
    let toDisplay = (
        <></>
    )
    switch (mode){
        case TableMode.daily:
            break;
        case TableMode.dayRange:
            break;
    }
    return toDisplay
}


export default function AnalyticsPage() {
    const [attenMetric, setAttenMetrics] = useState<any[] | undefined>(undefined);
    const [dailyTotal, setDailyTotal] = useState<any[] | undefined>(undefined);

    const [curDate, setCurDate] = useState<DateValueType>(null);
    const [menuActive, setMenuActive] = useState<Boolean>(false);
    const [filtPart, setFiltPart] = useState<any[]>([]);
    const [tableMode, setTableMode] = useState<TableMode>(TableMode.daily);

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
        const data = (await res.json()).data
        setAttenMetrics(data)
        console.log(data)
    }

    const fetchAttenAgg = async () => {
        const res = await fetch(`/api/get-attendance-metric?isAgg=true`);
        if (res.status != 200) {
            return
        }
        const data = (await res.json()).data
        setDailyTotal(data)
        // console.log(data)
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
                        <div>
                            <h2> Daily Attendance </h2>
                            <DailyAttenGraph width={600} height={400} data={dailyTotal} className="" />
                        </div>
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
                                <h2>Claim percentage!</h2>
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

                </div>
                <div className=" rounded-lg bg-white mt-4 shadow-md p-4">
                    <div className="mb-4 flex justify-between  ">
                        <div className=" text-xl font-semibold">
                            Participants
                        </div>
                        <IconButton color={menuActive ? "primary" : "default"} onClick={() => {
                            setMenuActive(!menuActive);
                        }}>
                            <FilterListIcon />
                        </IconButton>
                    </div>
                    <div className="flex items-center justify-between">
                        {menuActive && (
                            <div className=" w-80 h-full">
                                <div>
                                    <div>View Modes</div>
                                    <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Age</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={age}
                                        label="Age"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value={10}>Ten</MenuItem>
                                        <MenuItem value={20}>Twenty</MenuItem>
                                        <MenuItem value={30}>Thirty</MenuItem>
                                    </Select>
                                    </FormControl>
                                </div>
                                {/* Filter params */}
                                <div>
                                    {}
                                </div>
                            </div>
                        )}
                        <table className="w-full">
                            <thead className="w-full text-left">
                                <tr>
                                    <th className={tableCellStyle + " w-1/2"}>
                                        Account
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {attenMetric && attenMetric.length > 0 ? (
                                    <>
                                        {attenMetric.map(
                                            ({ account, datetime }, idx) => (
                                                <tr key={idx}>
                                                    <td className={tableCellStyle}>
                                                        {account}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </>
                                ) : (

                                    <div
                                        className={
                                            tableCellStyle + "border-none"
                                        }
                                    >
                                        There are no attendees yet :(
                                    </div>

                                )}

                            </tbody>
                        </table>
                    </div>
                </div>



            </div>


        </div>
    )
}