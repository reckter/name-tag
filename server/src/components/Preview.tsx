"use client"

import {
	drawFrameToCanvas,
	drawToString,
	toPackedPixel,
	unpackPixel,
} from "@/src/services/drawFrame.client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Canvas } from "canvas"

export function Preview({
	pixel,
	slide,
	frame,
}: {
	pixel: ReadonlyArray<ReadonlyArray<boolean>>
	slide: string
	frame: number
}) {
	const router = useRouter()
	const ref = useRef<HTMLCanvasElement>(null)

	const draw = useCallback(() => {
		if (ref.current) drawFrameToCanvas(pixel, ref.current! as unknown as Canvas)
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
			<canvas ref={ref} />
		</div>
	)
}
