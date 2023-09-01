import { NextApiRequest, NextApiResponse } from "next"
import { GlobalFonts } from "@napi-rs/canvas"

export default async function GET(
	req: NextApiRequest,
	res: NextApiResponse<ReadonlyArray<string>>,
) {
	return res.json(GlobalFonts.families.map((it) => it.family))
}
