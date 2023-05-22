// import dynamic from "next/dynamic";
import { add, differenceInCalendarDays, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
const dateFormatter = (date: any) => {
    return format(new Date(date), "dd/MM/yy");
};const style = {
    padding: 6,
    backgroundColor: "#fff",
    border: "1px solid #ccc"
  };
const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active) {
      const currData = payload && payload.length ? payload[0].payload : null;
      return (
        <div className="area-chart-tooltip" style={style}>
          <p>
            {currData ? format(new Date(currData.date), "yyyy-MM-dd") : " -- "}
          </p>
          <p>
            {"value : "}
            <em>{currData ? currData.count : " -- "}</em>
          </p>
        </div>
      );
    }
  
    return null;
  };

  const getTicks = (startDate: Date, endDate: Date, num: number) => {
    const diffDays = differenceInCalendarDays(endDate, startDate);
  
    let current = startDate,
      velocity = Math.round(diffDays / (num - 1));
  
    const ticks = [startDate.getTime()];
  
    for (let i = 1; i < num - 1; i++) {
      ticks.push(add(current, { days: i * velocity }).getTime());
    }
  
    ticks.push(endDate.getTime());
    return ticks;
  };
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
    data: any[] | undefined, // if got time, should have models folder
    className: string
}) {
    // let fakeData = [
    //     {
    //         count: 10,
    //         date: 1684627200000,
    //         dateString: "2023-05-21"
    //     },

    //     {
    //         count: 25,
    //         date: 1684108800000,
    //         dateString: "2023-05-15"
    //     }
    //     ,

    //     {
    //         count: 25,
    //         date: 1684808800000,
    //         dateString: "2023-05-23"
    //     }
    // ]
    // const fakeData2 = [
    //     { date: new Date(2019, 3, 30).getTime(), count: 2000 },
    //     { date: new Date(2019, 4, 30).getTime(), count: 5000 },
    //     { date: new Date(2019, 5, 30).getTime(), count: 5000 },
    //     { date: new Date(2019, 6, 21).getTime(), count: 6000 },
    //     { date: new Date(2019, 6, 28).getTime(), count: 9000 }
    // ];
    // console.log("data")
    // console.log(data)
    let domain: any[] = []
    let ticks: any[] = []
    if(data != undefined && data != null){
        // console.log(data[0])
        const startDate = new Date(data[0].date);
        const endDate = new Date(data[1].date);
        domain = [(dataMin: any) => dataMin, () => endDate.getTime()];
        ticks = getTicks(startDate, endDate, 5);
        // console.log(`ticks: ${ticks}`)
        // console.log("Graph data")
        // console.log(data)
    }

    // if (className == null) {
    //     className = ""
    // }
    return (
        // <ResponsiveContainer  width="100%" aspect={3}>
        <LineChart width={900} height={height} data={data} className={className} margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
        }} >
            <Line type="monotone" dataKey="count" />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="date"
                scale="time"
                ticks={ticks}
                tickFormatter={dateFormatter}
                domain={domain}
                type="number" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
        </LineChart>
        
        //  </ResponsiveContainer>
    )
}