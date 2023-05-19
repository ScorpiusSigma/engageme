import Navbar from "@/components/Navbar/Navbar";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { parseCSV } from "@/utils/csvParser";
import events from "..";
import * as uuid from "uuid";
import { tableCellStyle } from "@/utils";

// import { usePapaParse } from "react-papaparse";

export default function Event() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>();

  const [evtDeets, setEvtDeets] = useState<any>({
    name: "Solana Hackathon",
    startDate: "20/5/23",
    endDate: "27/5/23",
  });

  const [participants, setPart] = useState<any[] | null>(null);

  const [attenTakers, setAttenTakers] = useState<any[] | null>(null);
  const [isAddingAT, setIsAddAT] = useState<boolean>(false);
  const [newTaker, setNewTaker] = useState<{ taker_addr: string, name: string }>({
    taker_addr: "",
    name: ""
  });

  const getAttenTakers = async (e_id: string) => {
    const res = await fetch(`/api/events/${e_id}/atten_taker`);
    if (res.status != 200) {
      setAttenTakers([]);
      return
    }
    let data = await res.json()
    console.log(data)
    data = data.map((el: any) => {
      let toRet: { [name: string]: any } = {}
      for (const [k, v] of Object.entries(el)) {
        toRet[k] = Object.values(v as any)[0];
      }
      return toRet
    })
    console.log("Attendance takers")
    console.log(data)
    setAttenTakers(data)
  }

  const addAttenTaker = async () => {
    const { id } = router.query;
    const res = await fetch(
      `/api/events/${id}/atten_taker`, {
      method: "POST",
      body: JSON.stringify(newTaker),
      headers: new Headers({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
      )
    });
    if (res.status != 200) {
      // lmao lazy
      return
    }
    let newTakers = attenTakers || []
    newTakers.push(newTaker)
    setAttenTakers(newTakers)
    setIsAddAT(false);
  }

  const uploadParticipants = async () => {
    console.log("uploadParticipants")
    if (file == null || file == undefined) {
      return;
    }
    // const test = usePapaParse();
    var data = await parseCSV(file) as any[];
    for (let i = 0; i < data.length; i++) {
      let cur = data[i]
      if ('name' in cur && (cur['name'] == undefined || cur['name'].length == 0)) {
        data.splice(i, 1);
        continue
      }
      data[i]['participant_id'] = uuid.v4()
    }
    console.log(data);

    const { id } = router.query;
    const res = await fetch(
      `/api/events/${id}/participants`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
      )
    });
    if (res.status != 200) {
      console.log(res)
      return
    }
    setPart(data)
    setFile(null);
  }

  const fetchEventById = async () => {
    const { id } = router.query;
    console.log(`id: ${id}`);
    const res = await fetch(`/api/events/${id}`);
    if (res.status != 200) {
      setEvtDeets({
        name: "Event not found!",
        startDate: "-",
        endDate: "-",
      });
      return;
    }
    let data = await res.json();
    console.log(data)
    Object.entries(data).map(([k, v]) => {
      if (k == "organiser") delete data[k];
      data[k] = Object.values(v as any)[0];
    })
    console.log(data)
    setEvtDeets(data);
  };

  const fetchParticipantsByEvent = async () => {
    const { id } = router.query;
    console.log(`id: ${id}`);
    const res = await fetch(`/api/events/${id}/participants`);
    if (res.status != 200) {
      setPart(null);
      return;
    }
    let data = (await res.json());
    console.log(data)
    data = data.map((el: any) => {
      let toRet: { [name: string]: any } = {}
      for (const [k, v] of Object.entries(el)) {
        toRet[k] = Object.values(v as any)[0];
      }
      return toRet
    })
    console.log(data)
    setPart(data);
  };

  useEffect(() => {
    if (!router.isReady) return;
    const { id } = router.query;
    if (!id) {
      router.push("/events");
      return;
    }
    fetchEventById();
    fetchParticipantsByEvent();
    getAttenTakers(id as string);
  }, [router.isReady]);

  return (
    <div className="h-screen w-full bg-white dark:bg-slate-800 dark:text-white font-robo relative">
      {/* <div className="bg-black rounded-b-xl absolute top-0 left-0 h-1/3 w-full"></div> */}
      <Navbar />
      <div className="relative pt-16 mx-4">
        <div className="relative mt-4 font-semibold text-4xl ">
          {evtDeets.name}
        </div>
        <div className="mt-4 flex items-center  justify-between">
          <div>{evtDeets.description}</div>
          <div>{`${evtDeets.startDate} to ${evtDeets.endDate}`}</div>
        </div>
        {/* participants */}
        <div className=" rounded-lg bg-white shadow-md p-4">
          <div className="mb-4 flex justify-between  ">
            <div className=" text-xl font-semibold">Participants</div>
            <div className=" text-right">
              <div>Upload participant details</div>
              <Button variant="contained" component="label" className="">
                <UploadFileIcon />
                <span className="mt-1 ml-1">Upload</span>
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    setFile(files[0]);
                  }}
                />
              </Button>
              {file != null && (
                <Button
                  variant="contained"
                  component="label"
                  className=" bg-green-400 hover:bg-green-600 ml-3"
                  onClick={() => {
                    uploadParticipants();
                  }}
                >
                  <span className="mt-1">Confirm</span>
                </Button>
              )}
            </div>
          </div>
          {participants != null && participants.length > 0 ? (
            <Table className="">
              <TableHead className="">
                <TableRow className="">
                  {
                    Object.entries(participants[0]).map(([k, v]: [any, any], j) => {

                      // if (k == "evnet_id") { return }
                      return (
                        <TableCell key={j}>{k}</TableCell>
                      )
                    })
                  }
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((x: any, i) => (
                  <TableRow key={x["participant_id"]} className=" cursor-pointer hover:bg-slate-300" onClick={
                    (e) => {
                      router.push(`/events/${x["evnet_id"]}`)
                    }
                  }>{
                      Object.entries(x).map(([k, v]: [any, any], j) => {
                        if (k == "evnet_id") { return }

                        return (
                          <TableCell key={j}>{v}</TableCell>
                        )
                      }

                      )
                    }</TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div>
              No participants present yet!
            </div>
          )}

        </div>

        <div className=" rounded-lg bg-white mt-4 shadow-md p-4">
          <div className="mb-4 flex justify-between  ">
            <div className=" text-xl font-semibold">Attendance Takers</div>
            <Button onClick={() => { setIsAddAT(true) }}>
              <AddCircleOutlineIcon />
            </Button>
          </div>
          <table className="w-full">
            <thead className="w-full text-left">
              <tr>
                <th className={tableCellStyle + " w-1/2"}>
                  Name
                </th>
                <th className={tableCellStyle + " w-1/2"}>
                  Public Address
                </th>
              </tr>
            </thead>
            <tbody>
              {attenTakers && attenTakers.length > 0 ? (
                <>
                  {
                    attenTakers.map(({ name, taker_addr }, idx) => (
                      <tr key={idx}>
                        <td className={tableCellStyle}>
                          {name}
                        </td>
                        <td className={tableCellStyle}>
                          {taker_addr}
                        </td>
                      </tr>
                    ))
                  }
                </>
              ) :
                !isAddingAT && (
                  <div className={tableCellStyle + "border-none"}>
                    There are no attendance takers yet ;)
                  </div>
                )
              }

              {isAddingAT && (
                <tr className=" relative ">
                  <td className={tableCellStyle + " w-1/2"}>
                    <TextField name="Taker Name" value={newTaker?.name} onChange={(e) => {
                      const val = e.target.value
                      setNewTaker({
                        ...newTaker,
                        name: val
                      })
                    }} />
                  </td>
                  <td className={tableCellStyle + " w-1/2"}>
                    <TextField name="Taker Address" value={newTaker?.taker_addr} onChange={(e) => {
                      const val = e.target.value
                      setNewTaker({
                        ...newTaker,
                        taker_addr: val
                      })
                    }} />
                  </td>
                  <div className=" flex absolute right-0 top-6">
                    <Button variant="outlined" onClick={addAttenTaker}> Confirm </Button>
                    <Button variant="outlined" onClick={() => {
                      setIsAddAT(false)
                    }}> <CancelIcon /></Button>
                  </div>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
