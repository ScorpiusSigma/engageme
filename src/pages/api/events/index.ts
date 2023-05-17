import { ddbClient } from "@/utils";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { NextApiRequest, NextApiResponse } from "next";
import { PostResponse, PostError } from "../attendance-auth";

type GetResponse = any[];

async function get(req: NextApiRequest, res: NextApiResponse<GetResponse>) {
    const output = await getImpl();
    res.status(200).json(output);
    return
  }
  
  async function getImpl(): Promise<GetResponse> {
    const client = ddbClient;
    const { Items } = await client.send(
      new ScanCommand({
        TableName: "events"
      })
    );
  
    return Items as unknown as GetResponse;
  }
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetResponse | PostResponse | PostError>
  ) {
    console.log("events called");
    if (req.method === "GET") {
      // Getting the details for the events
      return await get(req, res);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  }
  