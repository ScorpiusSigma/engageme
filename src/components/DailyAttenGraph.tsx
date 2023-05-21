// import dynamic from "next/dynamic";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
// const dateFormatter = (date: any) => {
//     return format(new Date(date), "dd/MMM");
//   };

// const LineChart = dynamic(
// 	async () =>
// 		(await import("recharts")).LineChart,
// 	{ ssr: false }
// );

// const Line = dynamic(
// 	async () => (await import("recharts")).Line,
// 	{ ssr: false }
// );
// const XAxis = dynamic(
// 	async () =>
// 		(await import("recharts")).XAxis,
// 	{ ssr: false }
// );
// const YAxis = dynamic(
// 	async () =>
// 		(await import("recharts")).XAxis,
// 	{ ssr: false }
// );
// const Tooltip = dynamic(
// 	async () =>
// 		(await import("recharts")).XAxis,
// 	{ ssr: false }
// );
export default function DailyAttenGraph({
    width,
    height,
    data,
    className
}: {
    width: number,
    height: number,
    data: any[], // if got time, should have models folder
    className: string
}) {
    console.log("Graph data")
    console.log(data)
    // if (className == null) {
    //     className = ""
    // }
    return (
        // <ResponsiveContainer  width="100%" aspect={3}>
            <LineChart width={width} height={height} data={data} className={className} >
                <Line type="natural" dataKey="count" />
                {/* <CartesianGrid stroke="#ccc" strokeDasharray="5 5" /> */}
                <XAxis dataKey="e_time"
                    scale="time"
                    type="number" />
                <YAxis />
                <Tooltip />
            </LineChart>
        //  </ResponsiveContainer>
    )
}