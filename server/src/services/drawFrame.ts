import { SlideShow } from "@/src/types/slideShow"
import {
	Area,
	AreaContentPicture,
	AreaContentText,
	AreaContentType,
} from "@/src/types/area"
import { chain } from "@opencreek/ext"
import "../server/install-fonts"
import { createCanvas, GlobalFonts, SKRSContext2D } from "@napi-rs/canvas"
import { HEIGHT, WIDTH } from "@/src/services/drawFrame.client"

export function drawFrame(
	slideShow: SlideShow,
	frameNumber: number,
	font?: string,
): ReadonlyArray<ReadonlyArray<boolean>> {
	const canvas = createCanvas(WIDTH, HEIGHT)
	const ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, WIDTH, HEIGHT)
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, WIDTH, HEIGHT)
	ctx.fillStyle = "black"

	slideShow.areas.forEach((area) => {
		drawArea(ctx, frameNumber, area, font)
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
	ctx: SKRSContext2D,
	frameNumber: number,
	area: Area,
	font?: string,
) {
	// TODO not advancing every frame)
	const advanceBy = Math.floor(frameNumber / area.advanceEveryXFrames)
	const currentContent = area.content[advanceBy % area.content.length]
	console.dir(area.content)
	console.dir({advanceBy, lentgh: area.content.length})
	switch (currentContent.type) {
		case AreaContentType.Picture:
			drawAreaPicture(ctx, currentContent as AreaContentPicture, area)
			break
		case AreaContentType.Text:
			drawAreaText(ctx, currentContent as AreaContentText, area, font)
			break
	}
}

function drawAreaPicture(
	ctx: SKRSContext2D,
	areaContent: AreaContentPicture,
	area: Area,
) {
	areaContent.pixel.forEach((row, x) => {
		row.forEach((pixel, y) => {
			if (pixel) {
				ctx.fillStyle = "black"
				ctx.fillRect(x + area.x, y + area.y, 1, 1)
			} else if (pixel === false) {
				ctx.fillStyle = "white"
				ctx.fillRect(x + area.x, y + area.y, 1, 1)
			}
			// else pixel is undefined, so we don't draw anything, transparency babyyyy
		})
	})
}

function drawAreaText(
	ctx: SKRSContext2D,
	areaContent: AreaContentText,
	area: Area,
	font?: string,
) {
	ctx.font = `${areaContent.size}px ${areaContent.font ?? font ?? "pixelmix"}`
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

export function grayScaleToDrawInstructions(pixel: ReadonlyArray<ReadonlyArray<number>>) :Array<Array<Array<boolean>>> {
    const simple = pixel.map(row => row.map(toSimpleColor))

    const drawCode = simple
        .map(row => row.map(simpleColor16ToDrawArray))

    const drawPictures = [...new Array(15)]
        .map((_, x) => drawCode.map(row => row.map(it => it[x])))

    return drawPictures
}


function toSimpleColor(grayScale: number): number {
	// console.log(`pixel: ${pixel} => ${pixel >> 3}`)
	return grayScale >> 4
}

function simpleColor16ToDrawArray(pixel: number): Array<boolean> {
	const map = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],

		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],

		[0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
		[0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],

		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],

		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],

		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],

		[0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
		[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

		[0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	]

	const inverted = 15 - pixel
	if (pixel > 15) {
		console.log(`invalid pixel! pixel: ${pixel} => inverse: ${inverted}`)
	}
	return map[inverted].map((it: number) => it == 1)

}
