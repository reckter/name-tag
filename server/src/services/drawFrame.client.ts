import { chain } from "@opencreek/ext"
import type { Canvas } from "@napi-rs/canvas"
import { pick } from "next/dist/lib/pick"

export const HEIGHT = 128
export const WIDTH = 296

export function drawFrameToCanvas(
	pixels: ReadonlyArray<ReadonlyArray<boolean>>,
	canvas: Canvas,
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
	pixels: ReadonlyArray<ReadonlyArray<boolean>>,
): string {
	return pixels
		.map((row) => row.map((pixel) => (pixel ? "#" : " ")).join(""))
		.join("\n")
}

const packingLength = 8

export function toPackedPixel(
	pixel: ReadonlyArray<ReadonlyArray<boolean>>,
): ReadonlyArray<number> {
	const rotated = new Array(WIDTH)
		.fill(0)
		.map((_, x) => new Array(HEIGHT).fill(0).map((_, y) => pixel[y][x]))

	return chain(rotated)
		.flatten()
		.chunk(packingLength)
		.map((chunk) =>
			chunk.reduce(
				(acc, bit, i) => acc | (bit ? 1 << (packingLength - 1 - i) : 0),
				0,
			),
		)
		.value()
}

export function unpackPixel(
	packedPixel: ReadonlyArray<number>,
): ReadonlyArray<ReadonlyArray<boolean>> {
	const orig = chain(packedPixel)
		.map((packed) =>
			new Array(packingLength)
				.fill(0)
				.map((_, i) => (packed & (1 << (packingLength - 1 - i))) > 0),
		)
		.flatten()
		.chunk(HEIGHT)
		.value()

	const rotated = new Array(HEIGHT)
		.fill(0)
		.map((_, x) => new Array(WIDTH).fill(0).map((_, y) => orig[y][x]))
	return rotated
}
