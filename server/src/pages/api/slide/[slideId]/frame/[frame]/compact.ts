import { Area, AreaContentType } from "@/src/types/area"
import { drawFrame } from "@/src/services/drawFrame"
import { NextResponse } from "next/server"
import { NextApiRequest, NextApiResponse } from "next"
import { toPackedPixel } from "@/src/services/drawFrame.client"

function random(max: number) {
	return Math.floor(Math.random() * max)
}

export default async function GET(
	req: NextApiRequest,
	res: NextApiResponse<ReadonlyArray<number>>,
) {
	const frameNumber = parseInt(req.query.frame as string)
	const content = {
		id: "content",
		type: AreaContentType.Text,
		size: 17 + random(5),
		text: "Hello World",
	}
	const content2 = {
		id: "content",
		type: AreaContentType.Text,
		size: 17 + random(5),
		text: "toki!",
	}
	const areaText: Area = {
		id: "area",
		x: 0,
		y: 20,
		width: 269,
		height: 100,
		advanceEveryXFrames: 1,
		content: [content, content2],
	}
	const countContent = {
		id: "content",
		type: AreaContentType.Text,
		size: 27 + random(5),
		text: frameNumber.toString() + ": " + new Date().toISOString(),
	}
	const countText: Area = {
		id: "count",
		x: 0,
		y: 50 + random(10),
		width: 269,
		height: 100,
		advanceEveryXFrames: 1,
		content: [countContent],
	}
	const sizeBlackSquare = 5 + random(20)
	const contentBlackSquare = {
		id: "content",
		type: AreaContentType.Picture,
		pixel: [
			...new Array(sizeBlackSquare).fill(new Array(sizeBlackSquare).fill(true)),
		],
	}
	const sizeBigBlackSquare = 30 + random(40)
	const contentBlackSquareLowerCorner = {
		id: "content",
		type: AreaContentType.Picture,
		pixel: [
			...new Array(100)
				.fill(true)
				.map((_, x) =>
					new Array(100)
						.fill(true)
						.map(
							(_, y) => x > 100 - sizeBigBlackSquare && y > 100 - sizeBigBlackSquare,
						),
				),
		],
	}
	const areaImage: Area = {
		id: "area2",
		x: 200 + random(40),
		y: 10 + random(10),
		width: 100,
		height: 100,
		advanceEveryXFrames: 2,
		content: [contentBlackSquare, contentBlackSquareLowerCorner],
	}
	const slide = {
		id: "slide",
		name: "hello world",
		areas: [areaText, areaImage, countText],
	}
	const pixel = drawFrame(slide, frameNumber)
	const packed = toPackedPixel(pixel)
	const buffer = Buffer.from(packed)
	res.write(buffer)
	res.status(200).end()
}
