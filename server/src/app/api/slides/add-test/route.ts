import { MONGO_DB, mongoClient } from "@/src/services/mongo"
import { Area, AreaContentType } from "@/src/types/area"
import moment from "moment"
import { NextResponse } from "next/server"
import { v4 as uuid } from "uuid"

function random(max: number) {
	return Math.floor(Math.random() * max)
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)

	const content = {
		id: "content",
		type: AreaContentType.Text,
		size: 21,
		text: "Hannes",
		font: "5x7 practical",
	}
	const areaText: Area = {
		id: "name",
		x: 140,
		y: 50,
		width: 100,
		height: 30,
		advanceEveryXFrames: 1,
		content: [content],
	}
	const areaImage: Area = {
		id: "detail-picture",
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		advanceEveryXFrames: 1,
		content: [],
	}
	const slide = {
		id: uuid(),
		name: "hello world",
		chunkSize: 15,
		areas: [areaText, areaImage],
	}

	const db = mongoClient.db(MONGO_DB)
	const collection = db.collection("slides")

	const response = await collection.insertOne(slide)
	const ret = await collection.findOne({ id: slide.id })

	return NextResponse.json(ret)
}
