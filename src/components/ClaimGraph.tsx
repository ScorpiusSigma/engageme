// import { Tooltip } from "@mui/material";
// import { data } from "autoprefixer";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <>
      {
        percent != 0 ? (

          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
          </text>
        ) : (
          <></>
        )
      }
    </>
  );
};
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
export default function ClaimGraph({
  data
}: {
  data: any[]
}) {
  // console.log("Claim graog data")
  // console.log(data)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
        {/* <Tooltip children={undefined} title={undefined} /> */}
      </PieChart>
    </ResponsiveContainer>
  )
}