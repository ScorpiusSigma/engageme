import { ddbClient, ddbTables } from "@/utils";
import {
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  ScanCommand,
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

type GetResponse = Participant[]

type GetError = {
  error: string;
};


async function getParticipants(e_id: string) {
  const client = ddbClient;
  const { Items } = await client.send(
    new ScanCommand({
      TableName: ddbTables.evt_part,
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
  return Items
}

async function deleteParticipants(e_id: string) {
  console.log("deleteParticipants")
  const client = ddbClient;
  let old_data = [] as any[] | undefined
  try {
    old_data = await getParticipants(e_id)
  } catch (error) {
    // empty
    return
  }
  if (old_data == undefined || old_data.length == 0) {
    return
  }
  await client.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [ddbTables.evt_part]: old_data.map((el) => {
          return {
            DeleteRequest: {
              Key: {
                id: { S: e_id },
                participant_id: { S: el.participant_id },
              },
            }
          }
        })
      }
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
    for (const k in part) {
      let val = part[k]
      // if (val.length == 0) {
      //   val = ' '
      // }
      entry[k] = {
        S: val
      }
    }
    entry['event_id'] = { S: e_id }
    // console.log(entry)
    toAdd.push({
      "PutRequest": {
        "Item": entry
      }
    })
  }
  console.log(toAdd)

  //   ddbTables.evt_part
  const input: BatchWriteItemCommandInput = {
    RequestItems: {
      [ddbTables.evt_part]: toAdd
    }
  }
  console.log(input)
  // try {
  const res = await client.send(
    new BatchWriteItemCommand(input)
  );
  // } catch (error) {
  //   const message = "Participant Add Failed!";
  //   return {
  //     message
  //   };  
  // }
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
  console.log("new_participants")
  console.log(new_participants)

  try {
    const output = await postImpl(id as string, new_participants);
    res.status(200).json(output);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error adding participants" });
    return;
  }
}
async function getImpl(e_id: string): Promise<GetResponse> {
  const Items = await getParticipants(e_id)
  console.log("Items")
  console.log(Items)

  return Items as unknown as GetResponse;
  // try {

  // } catch (error) {

  //   return {
  //     participants: []
  //   };
  // }
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
