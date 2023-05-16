import { ddbClient, ddbTables } from "@/utils";
import {
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
} from "@aws-sdk/client-dynamodb";

import { NextApiRequest, NextApiResponse } from "next";

import * as uuid from "uuid";

type Participant = any;

type PostParam = Participant[];

type PostResponse = {
  message: string;
//   participants: Participant[];
};
type PostError = {
  error: string;
};

type GetResponse = {
  participants: Participant[];
};

type GetError = {
    error: string;
};

async function deleteParticipants(e_id: string) {
  const client = ddbClient;
  await client.send(
    new DeleteItemCommand({
      TableName: ddbTables.evt_part,
      Key: {
        id: { S: e_id },
      },
    })
  );
}

async function postImpl(
  e_id: string,
  new_participants: PostParam
): Promise<PostResponse> {
  const client = ddbClient;

  await deleteParticipants(e_id);

  let toAdd = [];

  for (const part of new_participants) {
    let entry = {} as any  
    for (const k in part){
        entry[k] = {
            S: part[k]
        }
    }
    entry['participant_id'] = uuid.v1()
    toAdd.push({
        PutRequest:{
            Item:entry
        }
    })
  }
  console.log(toAdd)
  
//   ddbTables.evt_part
  const input:BatchWriteItemCommandInput = {
      RequestItems: {
        [ddbTables.evt_part]: toAdd
      }
  }

  const res = await client.send(
    new BatchWriteItemCommand(input)
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
  const { id } = req.query; // Retrieve the square bracket param

  console.log(`id: ${id}`);
  if (id == undefined) {
    res.status(400);
    return;
  }
  const new_participants = req.body as PostParam;
  try {
    const output = await postImpl(id as string, new_participants);
    res.status(200).json(output);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error editting event" });
    return;
  }
}
async function getImpl(id: string): Promise<GetResponse> {
  const client = ddbClient;
  const { Item } = await client.send(
    new GetItemCommand({
      TableName: "evt_participants",
      Key: {
        event_id: { S: id },
      },
    })
  );

  return Item as unknown as GetResponse;
}

async function get(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | GetError>
) {
  const { id } = req.query; // Retrieve the square bracket param

  console.log(`id: ${id}`);
  if (id == undefined) {
    res.status(400);
    return;
  }
  try {
    const output = await getImpl(id as string);
    res.status(200).json(output);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error Getting Participants" });
    return;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
  console.log("events/[id] called");
  if (req.method === "GET") {
    // Getting the details for the events
    return await get(req, res);
  } else if (req.method === "POST") {
    // edit event details
    return await post(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
