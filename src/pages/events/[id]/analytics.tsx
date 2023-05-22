import ClaimGraph from "@/components/ClaimGraph";
import DailyAttenGraph from "@/components/DailyAttenGraph";
import Navbar from "@/components/Navbar/Navbar";
import { airdrop, justDate, tableCellStyle } from "@/utils";
import router from "next/router";
import { useEffect, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateRangeType, DateValueType } from "react-tailwindcss-datepicker/dist/types";

import FilterListIcon from '@mui/icons-material/FilterList';
import { FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import RedeemIcon from '@mui/icons-material/Redeem';
import Checkbox from '@mui/material/Checkbox';
import { PublicKey } from "@solana/web3.js";


import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

enum TableMode {
    daily,
    dayRange
}

const FilterMenu = ({ mode, dateRange, onChange, minMaxDate }: {
    mode: TableMode,
    dateRange: DateRangeType
    onChange: any
    minMaxDate: DateRangeType
}) => {
    let toDisplay = (
        <></>
    )
    switch (mode) {
        case TableMode.daily:
            toDisplay = (
                <div className="">
                    <Datepicker
                        startFrom={new Date(minMaxDate.startDate as string)}
                        useRange={false}
                        asSingle={true}
                        minDate={minMaxDate.startDate}
                        maxDate={minMaxDate.endDate}
                        value={dateRange}
                        onChange={onChange}
                    />
                </div>
            )
            break;
        case TableMode.dayRange:
            toDisplay = (
                <div>
                    <Datepicker
                        startFrom={new Date(minMaxDate.startDate as string)}
                        minDate={minMaxDate.startDate}
                        maxDate={minMaxDate.endDate}
                        value={dateRange}
                        onChange={onChange}
                    />
                </div>
            )
            break;
    }
    return toDisplay
}


export default function AnalyticsPage() {
    const [attenMetric, setAttenMetrics] = useState<any[] | undefined>(undefined);
    const [dailyTotal, setDailyTotal] = useState<any[] | undefined>(undefined);
    const [minMaxDate, setMinMaxDate] = useState<DateRangeType>({
        startDate: new Date("1970-01-01"),
        endDate: new Date(Date.now())
    });
    const [menuActive, setMenuActive] = useState<Boolean>(false);
    const [filtPart, setFiltPart] = useState<any[]>([]);
    const [filtRange, setFiltRange] = useState<DateRangeType>({
        startDate: new Date("1970-01-01"),
        endDate: new Date(Date.now())
    })

    let selectedP = new Set()
    const [isAirdropping, setAirdropping] = useState(false)
    // const [selectedP, setSelectP] = useState<Set<string>>(new Set())

    const [tableMode, setTableMode] = useState<TableMode>(TableMode.daily);


    const [pCnt, setPCnt] = useState<number | undefined>();
    const [claimCnt, setClaimCnt] = useState<number | undefined>();

    const filterParticipants = (filtRange: DateRangeType) => {
        if (!attenMetric) return
        setFiltPart(attenMetric.filter((p: any) => {
            const curDate = new Date(justDate(new Date(p.datetime)))
            const sDate = new Date(filtRange.startDate as string)
            const eDate = new Date(filtRange.endDate as string)
            // console.log(`curDate: ${curDate}`)
            // console.log(`sDate: ${sDate}`)
            // console.log(`eDate: ${eDate}`)
            const res = curDate >= sDate && curDate <= eDate
            // console.log(`To filter? ${res}`)
            return res
        }))
    }

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
        setFiltPart(data)
        // console.log(data)
    }

    const fetchAttenAgg = async () => {
        const res = await fetch(`/api/get-attendance-metric?isAgg=true`);
        if (res.status != 200) {
            return
        }
        const data = (await res.json())
        const minDate = new Date(data[0].dateString)
        const maxDate = new Date(data[data.length - 1].dateString)
        setDailyTotal(data)

        setFiltRange({
            startDate: minDate,
            endDate: maxDate,
        })
        const minDate2 = new Date()
        minDate2.setDate(minDate.getDate() - 1);
        setMinMaxDate({
            startDate: minDate2,
            endDate: maxDate
        })
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
                <div className="flex justify-between items-center my-2">
                    {dailyTotal != undefined ? (
                        <div className=" w-1/2 h-1/2">
                            <h2> Daily Attendance </h2>
                            <DailyAttenGraph width={600} height={400} data={dailyTotal} className="" />
                        </div>
                    ) : (
                        <div> No attendance taken yet </div>
                    )}
                    {
                        pCnt != undefined && claimCnt != undefined && (
                            <div
                                style={{
                                    width: 400,
                                    height: 400
                                }}
                            >
                                <h2>Claim percentage!</h2>
                                <ClaimGraph data={
                                    [
                                        {
                                            name: "Not Claimed", value: pCnt - claimCnt//pCnt-claimCnt
                                        },
                                        {
                                            name: "Claimed", value: claimCnt// claimCnt
                                        }
                                    ]
                                } />
                            </div>
                        )
                    }

                </div>
                <div className=" rounded-lg bg-white my-4 shadow-md p-4">
                    <div className="mb-4 flex justify-between  ">
                        <div className=" text-xl font-semibold">
                            Participants
                        </div>
                        <div>
                            <IconButton color={menuActive ? "primary" : "default"} onClick={() => {
                                setMenuActive(!menuActive);
                            }}>
                                <FilterListIcon />
                            </IconButton>
                            <IconButton className=" " disabled={isAirdropping} onClick={async () => {
                                setAirdropping(true)
                                toast.promise(
                                    async () => {
                                        await airdrop(router.query.id as string,(Array.from(selectedP) as PublicKey[]))
                                        setAirdropping(false)
                                    }
                                    ,
                                    {
                                        pending: 'Airdropping in progress~',
                                        success: '🦄 Airdrop is a success!',
                                        error: 'Airdropping failed 🤯'
                                    }
                                )
                                // toast('🦄 Airdropping in progress~', {
                                //     position: "top-right",
                                //     autoClose: 5000,
                                //     hideProgressBar: false,
                                //     closeOnClick: true,
                                //     pauseOnHover: true,
                                //     draggable: true,
                                //     progress: undefined,
                                //     theme: "light",
                                //     });
                                // // let res = await airdrop((Array.from(selectedP) as PublicKey[]))
                                // setTimeout(()=>{
                                //     toast.success('🦄 Airdrop is a success!', {
                                //         position: "top-right",
                                //         autoClose: 5000,
                                //         hideProgressBar: false,
                                //         closeOnClick: true,
                                //         pauseOnHover: true,
                                //         draggable: true,
                                //         progress: undefined,
                                //         theme: "light",
                                //         });
                                // },3000)
                                setAirdropping(false)
                            }}>
                                <RedeemIcon />
                            </IconButton>
                        </div>
                    </div>
                    <div className="flex justify-between h-full">
                        {menuActive && (
                            <div className=" min-w-64 h-full flex-none pt-14 mr-4">
                                <div className="h-full">
                                    <FormControl fullWidth>
                                        <InputLabel id="demo-simple-select-label">View Modes</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={tableMode as unknown as string}
                                            label="View Modes"
                                            onChange={(e: SelectChangeEvent) => {
                                                setTableMode(e.target.value as unknown as TableMode)
                                            }}
                                        >
                                            <MenuItem value={TableMode.daily}>Daily</MenuItem>
                                            <MenuItem value={TableMode.dayRange}>Range of dates</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                                {/* Filter params */}
                                <FilterMenu mode={tableMode} dateRange={filtRange} minMaxDate={minMaxDate} onChange={(newRange: DateRangeType) => {
                                    setFiltRange(newRange)
                                    filterParticipants(newRange)
                                }} />
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
                                {filtPart && filtPart.length > 0 ? (
                                    <>
                                        {filtPart.map(
                                            ({ account, datetime }, idx) => (
                                                <tr key={idx}>
                                                    <td className={tableCellStyle + " relative flex items-center justify-between"}>
                                                        <span>{account}</span>
                                                        {/* absolute right-2 top-0 */}
                                                        <Checkbox onChange={(event: any) => {
                                                            console.log(`event`)
                                                            console.log(event)
                                                            const isChecked = event.target.checked
                                                            if (isChecked) {
                                                                selectedP.add(account)
                                                            } else {
                                                                selectedP.delete(account)
                                                            }
                                                        }} />
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
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            {/* Same as */}
            <ToastContainer />

        </div>
    )
}