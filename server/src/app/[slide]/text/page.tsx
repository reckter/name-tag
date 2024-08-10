"use client"
import { queryTypes, useQueryState } from "next-usequerystate"
import { useState } from "react"
import Link from "next/link"

export default function UploadPicture({ params }: { params: { slide: string } }) {
	const slide = params.slide
	const [areaId, setAreaId] = useQueryState<string>(
		"area",
		queryTypes.string.withDefault("subtitle")
	)
	const [text, setText] = useState<string | undefined>()
	const [isLoading, setIsLoading] = useState(false)

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!text) return
		setIsLoading(true)

		try {
			const res = await fetch(
				`/api/slides/${slide}/areas/${areaId}/update-text`,
				{
					method: "POST",
					body: JSON.stringify({
						text
					})
				}
			)
			// handle the error
			if (!res.ok) throw new Error(await res.text())
		} catch (e: any) {
			// Handle errors here
			console.error(e)
		} finally {
			setIsLoading(false)
		}
	}

	return <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-4">
		<Link href="/">Back</Link>
		<form onSubmit={onSubmit} className={"flex flex-col gap-4"}>
			<div className="flex flex-row gap-2">
				<label>Area</label>
				<input value={areaId} onChange={(e) => setAreaId(e.target.value)} className="text-black" />
			</div>
			<div className="flex flex-row gap-2">
				<label>Text</label>
				<input value={text} onChange={(e) => setText(e.target.value)} className={"text-black"} />
			</div>
			<input
				type="submit"
				value="Set text"
				disabled={isLoading}
				style={{
					padding: "12px",
					marginTop: "12px",
					border: "1px solid #eaeaea"
				}}
			/>
			{isLoading && <p>Loading...</p>}
		</form>
	</main>
}