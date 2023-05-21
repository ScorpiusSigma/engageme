import { ddbClient, ddbTables } from "@/utils";
import { GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { NextApiRequest, NextApiResponse } from "next";

type GetResponse = {
    orgProxy: string
}
type PostError = {
  error: string;
};


async function get(req: NextApiRequest, res: NextApiResponse<GetResponse | PostError>) {
    const { id } = req.query; // Retrieve the square bracket param
  
    if (id == undefined) {
      res.status(400);
      return
    }
    try {
        
    const output = await getImpl(id as string);
    res.status(200).json(output);   
    } catch (e){
        res.status(500).json({ error: "error getting organiser proxy" });
    }
    return
  }
  
  async function getImpl(e_id: string): Promise<GetResponse> {
    const client = ddbClient;
    const { Item } = await client.send(
      new GetItemCommand({
        TableName: ddbTables.evt,
        Key: {
            event_id: { S: e_id },
        },
        AttributesToGet: ["orgProxy"]
      })
    );
  
    return Item as unknown as GetResponse;
  }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | PostError>
) {
  if (req.method === "GET") {
    // Getting the details for the events
    return await get(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
