"use client"

import {
	drawFrameToCanvas,
	HEIGHT,
	unpackPixel,
	WIDTH,
} from "@/src/services/drawFrame.client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Canvas } from "@napi-rs/canvas"

export function Preview({
	pixel,
	slide,
	frame,
}: {
	pixel: ReadonlyArray<number>
	slide: string
	frame: number
}) {
	const router = useRouter()
	const ref = useRef<HTMLCanvasElement>(null)

	const draw = useCallback(() => {
		const unpacked = unpackPixel(pixel)
		if (ref.current)
			drawFrameToCanvas(unpacked, ref.current! as unknown as Canvas)
	}, [pixel])

	useEffect(() => {
		draw()
	}, [draw])

	return (
		<div>
			<div className={"flex flex-row space-x-2 color-red m-2 mb-7"}>
				{frame > 0 && (
					<Link
						href={`/${slide}/preview/${frame - 1}`}
						className={
							"p-2 rounded-lg border border-slate-200 hover:bg-slate-700"
						}
					>
						previous
					</Link>
				)}
				<Link
					href={`/${slide}/preview/${frame + 1}`}
					className={
						"p-2 rounded-lg border border-slate-200 hover:bg-slate-700"
					}
				>
					next
				</Link>
			</div>
			<canvas ref={ref} width={WIDTH} height={HEIGHT} />
		</div>
	)
}
