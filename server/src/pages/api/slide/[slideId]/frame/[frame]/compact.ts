import { Area, AreaContentType } from "@/src/types/area"
import { drawFrame } from "@/src/services/drawFrame"
import { NextResponse } from "next/server"
import { NextApiRequest, NextApiResponse } from "next"
import { toPackedPixel } from "@/src/services/drawFrame.client"

export default async function GET(
	req: NextApiRequest,
	res: NextApiResponse<ReadonlyArray<number>>,
) {
	const frameNumber = parseInt(req.query.frame as string)
	const content = {
		id: "content",
		type: AreaContentType.Text,
		size: 20,
		text: "Hello World",
	}
	const content2 = {
		id: "content",
		type: AreaContentType.Text,
		size: 20,
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
		size: 20,
		text: frameNumber.toString(),
	}
	const countText: Area = {
		id: "count",
		x: 0,
		y: 50,
		width: 269,
		height: 100,
		advanceEveryXFrames: 1,
		content: [countContent],
	}
	const contentBlackSquare = {
		id: "content",
		type: AreaContentType.Picture,
		pixel: [...new Array(10).fill(new Array(10).fill(true))],
	}
	const contentBlackSquareLowerCorner = {
		id: "content",
		type: AreaContentType.Picture,
		pixel: [
			...new Array(100)
				.fill(true)
				.map((_, x) =>
					new Array(100).fill(true).map((_, y) => x > 50 && y > 50),
				),
		],
	}
	const areaImage: Area = {
		id: "area2",
		x: 200,
		y: 10,
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
