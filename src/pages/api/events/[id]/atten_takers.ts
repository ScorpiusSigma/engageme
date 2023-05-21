import { ddbClient, ddbTables } from "@/utils";
import { GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { NextApiRequest, NextApiResponse } from "next";
type GetResponse = any[];
type PostResponse = {
  message: string
};

type PostParam = {
  event_id: string;
  name: string;
  taker_addr: string;
};
type PostError = {
  error: string;
};

async function postImpl(
    e_id: string,
    new_taker: PostParam
  ): Promise<PostResponse> {
    const client = ddbClient;
    let Item = {
        event_id: { S: e_id },
        taker_addr: { S: new_taker.taker_addr },
        name: { S: new_taker.name }
    }
    await client.send(
        new PutItemCommand({
          TableName: ddbTables.atten,
          Item,
        })
      );

    const message = "Participant Add Success!";
    return {
      message
    };
  }

async function post(
    req: NextApiRequest,
    res: NextApiResponse<PostResponse | PostError>
  ) {
    const new_taker = req.body as PostParam;
    try {
      const { id } = req.query; 
      const output = await postImpl(id as string, new_taker);
      res.status(200).json(output);
      return;
    } catch (error) {
      res.status(500).json({ error: "error adding taker" });
      return;
    }
  }


async function get(req: NextApiRequest, res: NextApiResponse<GetResponse>) {
  const { id } = req.query; // Retrieve the square bracket param

  if (id == undefined) {
    res.status(400);
    return
  }
  const output = await getImpl(id as string);
  res.status(200).json(output);
  return
}

async function getImpl(e_id: string): Promise<GetResponse> {
  const client = ddbClient;
  const { Items } = await client.send(
    new ScanCommand({
      TableName: ddbTables.atten,
      FilterExpression: "#pk = :pk_value",
      ExpressionAttributeNames: {
        '#pk': 'event_id'
      },
      ExpressionAttributeValues: {
        ':pk_value': {
          'S': e_id
        }
      }
    })
  );

  return Items as unknown as GetResponse;
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetResponse | PostResponse | PostError>
  ) {
    if (req.method === "GET") {
      // Getting the details for the events
      return await get(req, res);
    } else if (req.method === "POST") {
      // edit event details
      return await post(req, res);
    } else if (req.method == "DELETE") {

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  }
  