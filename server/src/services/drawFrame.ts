import { SlideShow } from "@/src/types/slideShow"
import { createCanvas, CanvasRenderingContext2D } from "canvas"
import {
	Area,
	AreaContentPicture,
	AreaContentText,
	AreaContentType,
} from "@/src/types/area"
import { chain } from "@opencreek/ext"

const HEIGHT = 128
const WIDTH = 269

export function drawFrame(
	slideShow: SlideShow,
	frameNumber: number,
): ReadonlyArray<ReadonlyArray<boolean>> {
	const canvas = createCanvas(WIDTH, HEIGHT)
	const ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, WIDTH, HEIGHT)
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, WIDTH, HEIGHT)
	ctx.fillStyle = "black"

	slideShow.areas.forEach((area) => {
		drawArea(ctx, frameNumber, area)
	})
	const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)

	return chain(imageData.data)
		.chunk(4)
		.map((pixel) => pixel[0] == 0) // just checking R channel here, but should be good enough right
		.chunk(WIDTH)
		.value()
}

// packs a pixel array into a packed pixel array
// also flips x and y, because the canvas is axactly 128 high

export function drawArea(
	ctx: CanvasRenderingContext2D,
	frameNumber: number,
	area: Area,
) {
	// TODO not advancing every frame)
	const advanceBy = Math.floor(frameNumber / area.advanceEveryXFrames)
	const currentContent = area.content[advanceBy % area.content.length]
	switch (currentContent.type) {
		case AreaContentType.Picture:
			drawAreaPicture(ctx, currentContent as AreaContentPicture, area)
			break
		case AreaContentType.Text:
			drawAreaText(ctx, currentContent as AreaContentText, area)
			break
	}
}

function drawAreaPicture(
	ctx: CanvasRenderingContext2D,
	areaContent: AreaContentPicture,
	area: Area,
) {
	areaContent.pixel.forEach((row, x) => {
		row.forEach((pixel, y) => {
			if (pixel) {
				ctx.fillStyle = "black"
				ctx.fillRect(x + area.x, y + area.y, 1, 1)
			} else {
				ctx.fillStyle = "white"
				ctx.fillRect(x + area.x, y + area.y, 1, 1)
			}
		})
	})
}

function drawAreaText(
	ctx: CanvasRenderingContext2D,
	areaContent: AreaContentText,
	area: Area,
) {
	ctx.font = `bold ${areaContent.size}px san-serif`
	ctx.fillStyle = "black"
	ctx.strokeText(areaContent.text, area.x, area.y, area.width)
	ctx.fillText(areaContent.text, area.x, area.y, area.width)
}

function getTotalFrames(slide: SlideShow): number {
	const cycles = slide.areas.map(
		(it) => it.advanceEveryXFrames * it.content.length,
	)
	return lcm(...cycles)
}

function lcm(...arr: number[]): number {
	const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y))
	const _lcm = (x: number, y: number) => (x * y) / gcd(x, y)
	return [...arr].reduce((a, b) => _lcm(a, b))
}
