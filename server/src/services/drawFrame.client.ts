import { chain } from "@opencreek/ext"
import type { Canvas } from "@napi-rs/canvas"
import { pick } from "next/dist/lib/pick"

export const HEIGHT = 128
export const WIDTH = 296

export function drawFrameToCanvas(
	pixels: ReadonlyArray<ReadonlyArray<boolean>>,
	canvas: Canvas
) {
	canvas.width = pixels[0].length
	canvas.height = pixels.length

	const ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	ctx.fillStyle = "black"

	pixels.forEach((row, y) => {
		row.forEach((pixel, x) => {
			if (pixel) {
				ctx.fillRect(x, y, 1, 1)
			}
		})
	})
	ctx.save()
}

export function drawToString(
	pixels: ReadonlyArray<ReadonlyArray<boolean>>
): string {
	return pixels
		.map((row) => row.map((pixel) => (pixel ? "#" : " ")).join(""))
		.join("\n")
}

const packingLength = 8

export function toPackedPixel(
	pixel: ReadonlyArray<ReadonlyArray<boolean>>
): ReadonlyArray<number> {
	const rotated = new Array(WIDTH)
		.fill(0)
		.map((_, x) => new Array(HEIGHT).fill(0).map((_, y) => pixel[y][x]))

	return chain(rotated)
		.flatten()
		.chunk(packingLength)
		.map((chunk) =>
			chunk.reduce(
				(acc, bit, i) => acc | (!bit ? 1 << (packingLength - 1 - i) : 0),
				0
			)
		)
		.value()
}

export function unpackPixel(
	packedPixel: ReadonlyArray<number>
): ReadonlyArray<ReadonlyArray<boolean>> {
	const orig = chain(packedPixel)
		.map((packed) =>
			new Array(packingLength)
				.fill(0)
				.map((_, i) => (packed & (1 << (packingLength - 1 - i))) == 0)
		)
		.flatten()
		.chunk(HEIGHT)
		.value()

	const rotated = new Array(HEIGHT)
		.fill(0)
		.map((_, x) => new Array(WIDTH).fill(0).map((_, y) => orig[y][x]))
	return rotated
}

// Either
// 0CXXXXXX
//    with C = color, and XXXXXX = run length
// or
// 1XXXXXXX
//    with XXXXXXX = raw data of 7 pixels
export function compress(
	pixelGrid: ReadonlyArray<ReadonlyArray<boolean>>
): ReadonlyArray<number> {
	const rotated = new Array(WIDTH)
		.fill(0)
		.map((_, x) => new Array(HEIGHT).fill(0).map((_, y) => pixelGrid[y][x]))
	console.log(`compressing ${rotated.length}x${rotated[0].length}`)
	const compressed = []
	const pixel = rotated.flat()
	let i = 0
	while (i < pixel.length) {
		const current = pixel[i]
		let runLength = 0
		while (i + runLength < pixel.length && pixel[i + runLength] === current && runLength < 63) {
			runLength++
		}

		if (runLength > 7) {
			const byte = runLength | (current ? 0x40 : 0)
			compressed.push(byte)
			i += runLength
		} else {
			let byte = 1
			for (let j = 0; j < 7; j++) {
				byte = byte << 1
				byte |= (i + j > pixel.length || pixel[i + j]) ? 1 : 0
			}
			compressed.push(byte)
			i += 7
		}
	}
	console.log(`compressed from ${pixel.length} to ${compressed.length}`)
	return compressed
}

export function decompress(
	compressed: ReadonlyArray<number>
): ReadonlyArray<ReadonlyArray<boolean>> {
	const decompressed: Array<boolean> = []
	let i = 0
	while (i < compressed.length) {
		const byte = compressed[i]
		if (byte & 0x80) {
			for (let j = 0; j < 7; j++) {
				const color = byte & (1 << (6 - j))
				decompressed.push(color !== 0)
			}
			i++
		} else {
			const runLength = byte & 0x3f
			const color = byte & 0x40
			console.log(byte, color, runLength)
			for (let j = 0; j < runLength; j++) {
				decompressed.push(color !== 0)
			}
			i++
		}
	}
	console.log(`decompressed from ${compressed.length} to ${decompressed.length}`)
	const grid = chain(decompressed).chunk(HEIGHT).value()

	const rotated = new Array(HEIGHT)
		.fill(0)
		.map((_, x) => new Array(WIDTH).fill(0).map((_, y) => grid[y][x]))

	console.log(`decompressing ${rotated.length}x${rotated[0].length}`)
	return rotated
}