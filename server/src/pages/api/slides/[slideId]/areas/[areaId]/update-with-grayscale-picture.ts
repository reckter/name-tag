import { grayScaleToDrawInstructions } from "@/src/services/drawFrame"
import { MONGO_DB, mongoClient } from "@/src/services/mongo"
import { AreaContentPicture, AreaContentType } from "@/src/types/area"
import { SlideShow } from "@/src/types/slideShow"
import { chain } from "@opencreek/ext"
import { NextApiRequest, NextApiResponse } from "next"
import { NextResponse } from "next/server"
import { PNG } from "pngjs"
import sharp from "sharp"
import formidable from "formidable"
import { Writable } from "stream"

export const config = {
	api: {
		bodyParser: false,
	},
}

const formidableConfig = {
	keepExtensions: true,
	maxFileSize: 100_000_000,
	maxFieldsSize: 100_000_000,
	maxFields: 7,
	allowEmptyFiles: false,
	multiples: false,
}

function formidablePromise(
	req: NextApiRequest,
	opts?: Parameters<typeof formidable>[0],
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
	return new Promise((accept, reject) => {
		const form = formidable(opts)

		form.parse(req, (err, fields, files) => {
			if (err) {
				return reject(err)
			}
			return accept({ fields, files })
		})
	})
}

const fileConsumer = <T = unknown>(acc: T[]) => {
	const writable = new Writable({
		write: (chunk, _enc, next) => {
			acc.push(chunk)
			next()
		},
	})

	return writable
}

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(404).end()

	const params = req.query
	const slideId = params.slideId as string
	const areaId = params.areaId as string
	const chunks: never[] = []

	const { fields, files } = await formidablePromise(req, {
		...formidableConfig,
		// consume this, otherwise formidable tries to save the file to disk
		fileWriteStreamHandler: () => fileConsumer(chunks),
	})
	const fileData = Buffer.concat(chunks) // or is it from? I always mix these up

	const png = new PNG()
	const scaled = sharp(fileData)
		.resize(128, 128)
		.rotate()
		.greyscale()
		.png()

	const buffer = await scaled.toBuffer()
	const data = await new Promise<PNG>((accept) => {
		png.parse(buffer, (err, data) => {
			accept(data)
		})
	})

	const pixel = chain(data.data)
		.chunk(data.width * 4)
		.map((it) =>
			chain(it)
				.chunk(4)
				.map((it) => it[0])
				.value(),
		)
		.value()

	const instructions = grayScaleToDrawInstructions(pixel)

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
	area.content = instructions.map((it, index) => {
		return {
			type: AreaContentType.Picture,
			id: index.toString(),
			pixel: it,
		} satisfies AreaContentPicture
	})

	await collection.updateOne({ id: slide.id }, { $set: { areas: slide.areas } })
	const ret = await collection.findOne({ id: slide.id })
	console.dir(ret)

	res.status(200).json(ret)
}
