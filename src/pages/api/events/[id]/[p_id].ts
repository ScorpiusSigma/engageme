import { ddbClient, ddbTables } from "@/utils";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { NextApiRequest, NextApiResponse } from "next";

type Participant = any;


type GetResponse = Participant


type GetError = {
    error: string;
};

const getParticipant = async (e_id: string, p_id: string) => {
    const client = ddbClient;
    const { Item } = await client.send(
        new GetItemCommand({
            TableName: ddbTables.evt_part,
            Key: {
                event_id: { S: e_id },
                participant_id: { S: p_id },
            },
        })
    );
    return Item
}



async function getImpl(e_id: string, p_id: string): Promise<GetResponse> {
    const Items = await getParticipant(e_id, p_id)
    console.log("Items")
    console.log(Items)
    return Items as unknown as GetResponse;
}

async function get(
    req: NextApiRequest,
    res: NextApiResponse<GetResponse | GetError>
) {
    console.log("req.query")
    console.log(req.query)
    const { id, p_id } = req.query; // Retrieve the square bracket param

    console.log(`id: ${id}, p_id: ${p_id}`);
    if (id == undefined) {
        res.status(400);
        return;
    }
    try {
        const output = await getImpl(id as string, p_id as string);
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
    res: NextApiResponse<GetResponse>
  ) {
    console.log("events/[id]/[p_id] called");
    if (req.method === "GET") {
       await get(req, res);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  }
  