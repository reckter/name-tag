import { grayScaleToDrawInstructions } from "@/src/services/drawFrame"
import { MONGO_DB, mongoClient } from "@/src/services/mongo"
import { AreaContentPicture, AreaContentType } from "@/src/types/area"
import { SlideShow } from "@/src/types/slideShow"
import { chain } from "@opencreek/ext"
import { NextApiRequest, NextApiResponse } from "next"

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(404).end()

	const params = req.query
	const slideId = params.slideId as string
	const areaId = params.areaId as string
	const text = req.body.text

	const db = mongoClient.db(MONGO_DB)
	const collection = db.collection("slides")

	const slide = await collection.findOne<SlideShow>({ id: slideId })
	if (slide == undefined) {
		res.status(404).json({ error: "no slide found" })
		return
	}

	const area = slide.areas.find((it) => it.id === areaId)
	if (area == undefined) {
		res.status(404).json({ error: "no area found" })
		return
	}

	area.content = {
		type: AreaContentType.Text,
		id: "content",
		text: text
	} satisfies AreaContentPicture

	await collection.updateOne({ id: slide.id }, { $set: { areas: slide.areas } })
	const ret = await collection.findOne({ id: slide.id })
	console.dir(ret)

	res.status(200).json(ret)
}