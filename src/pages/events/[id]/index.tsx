import Navbar from "@/components/Navbar/Navbar";
import { Button, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { parseCSV } from "@/utils/csvParser";
import events from "..";

// import { usePapaParse } from "react-papaparse";

export default function Event() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>();

  const [evtDeets, setEvtDeets] = useState({
    name: "Solana Hackathon",
    startDate: "20/5/23",
    endDate: "27/5/23",
  });

  const [participants, setPart] = useState<any[] | null>(null);

  const uploadParticipants = async () => {
    if (file == null || file == undefined) {
      return;
    }
    // const test = usePapaParse();
    var data = await parseCSV(file);
    console.log(data);
  };

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
    const data = await res.json();
    setEvtDeets(data);
  };

  const fetchParticipantsByEvent = async () => {
    const { id } = router.query;
    console.log(`id: ${id}`);
    const res = await fetch(`/api/events/${id}/participants`);
    if (res.status != 200) {
      setPart(null);
    }
    setPart(await res.json());
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchEventById();
    fetchParticipantsByEvent();
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
          <div>insert_description</div>
          <div>{`${evtDeets.startDate} to ${evtDeets.endDate}`}</div>
        </div>
        {/* participants */}
        <div className=" rounded-lg bg-white shadow-md p-4">
          <div className="mb-4 flex justify-between">
            <div className=" text-xl font-semibold">Participants</div>
            <div className=" text-right">
              <div>Upload participant details</div>
              <Button variant="contained" component="label">
                <UploadFileIcon />
                Upload
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
                  onClick={() => {
                    uploadParticipants();
                  }}
                >
                  Confirm
                </Button>
              )}
            </div>
          </div>
          {/* table */}
          {participants != null && participants.length > 0 && (
            <TableContainer>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Attendance</TableCell>
                  <TableCell align="right">Start Date</TableCell>
                  <TableCell align="right">End Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((x, index) => (
                  <TableRow key={index}></TableRow>
                ))}
              </TableBody>
            </TableContainer>
          )}
        </div>
      </div>
    </div>
  );
}
