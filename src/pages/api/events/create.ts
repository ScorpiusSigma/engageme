import { NextApiRequest, NextApiResponse } from "next";

import * as uuid from "uuid";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { ddbClient, ddbTables } from "@/utils";
type PostParam = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  organiser: string;
};

type PostResponse = {
  message: string;
  id: string;
};
type PostError = {
  error: string;
};

async function postImpl(evtDetails: PostParam): Promise<PostResponse> {
  const client = ddbClient;

  const evtDetails2 = {
    name: { S: evtDetails.name },
    description: { S: evtDetails.description },
    startDate: { S: evtDetails.startDate },
    endDate: { S: evtDetails.endDate },
    organiser: { S: evtDetails.organiser },
  };
  const id = uuid.v4();
  const Item = {
    evnet_id: { S: id },
    ...evtDetails2,
  };
  console.log("Item")
  console.log(Item)
  await client.send(
    new PutItemCommand({
      TableName: ddbTables.evt,
      Item,
    })
  );

  //   return res.status(201).json(Item);
  const message = "Create Event Success!";
  // stick to incremental id , then can follow this method possibly https://stackoverflow.com/questions/53550001/get-latest-max-for-each-partition-key
  return {
    message,
    id,
  };
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse | PostError>
) {
  const details = req.body as PostParam;
  try {
    const output = await postImpl(details);
    res.status(200).json(output);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error editting event" });
    return;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse | PostError>
) {
  if (req.method === "POST") {
    // edit event details
    return await post(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
