import { ddbClient, ddbTables } from "@/utils";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { NextApiRequest, NextApiResponse } from "next";
type GetResponse = {
  start_date: Date;
  end_date: Date;
};
type PostResponse = {
  name: string;
  start_date: Date;
  end_date: Date;
};

type PostParam = {
  id: string;
};
type PostError = {
  error: string;
};

async function get(req: NextApiRequest, res: NextApiResponse<GetResponse>) {
  // const {
  //   query: { id },
  //   method,
  // } = req;
  const { id } = req.query; // Retrieve the square bracket param

  if (id == undefined) {
    res.status(400);
    return
  }
  const output = await getImpl(id as string);
  res.status(200).json(output);
  return
}

async function getImpl(id: string): Promise<PostResponse> {
  const client = ddbClient;
  const { Item } = await client.send(
    new GetItemCommand({
      TableName: ddbTables.evt,
      Key: {
        evnet_id: { S: id }
      },
    })
  );

  return Item as unknown as PostResponse;
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
    // return await post(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
