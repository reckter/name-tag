import { MONGO_DB, mongoClient } from "@/src/services/mongo"
import { SlideShow } from "@/src/types/slideShow"
import { NextResponse } from "next/server"

export async function POST(
	request: Request,
	{ params }: { params: { slideId: string; areaId: string } },
) {
	const { searchParams } = new URL(request.url)
	const slideId = params.slideId
	const areaId = params.areaId

	const db = mongoClient.db(MONGO_DB)
	const collection = db.collection("slides")

	const slide = await collection.findOne<SlideShow>({ id: slideId })
	if (slide == undefined) {
		return NextResponse.json({ error: "no slide found" })
	}

	const area = slide.areas.find((it) => it.id === areaId)
	if (area == undefined) {
		return NextResponse.json({ error: "no area found" })
	}
	area.content = await request.json()
	await collection.updateOne({ id: slide.id }, { $set: { areas: slide.areas } })
	const ret = await collection.findOne({ id: slide.id })

	console.dir(ret)
	return NextResponse.json(ret)
}
