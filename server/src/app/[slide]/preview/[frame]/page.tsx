import { Area, AreaContentType } from "@/src/types/area"
import { drawFrame } from "@/src/services/drawFrame"
import { Preview } from "@/src/components/Preview"

export default function PreviewFrame({
	params,
}: {
	params: { slide: string; frame: string }
}) {
	const frameNumber = parseInt(params.frame)
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
		areas: [areaText, areaImage],
	}
	const pixel = drawFrame(slide, frameNumber)
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<Preview pixel={pixel} slide={params.slide} frame={frameNumber} />
		</main>
	)
}
