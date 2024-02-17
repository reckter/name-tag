import { Preview } from "@/src/components/Preview"
import { GlobalFonts } from "@napi-rs/canvas"
import Link from "next/link"

const baseUrl = process.env.BASE_URL
	? `https://${process.env.BASE_URL}`
	: "http://localhost:3000"

export default async function PreviewFrame({
	params,
	searchParams,
}: {
	params: { slide: string; frame: string }
	searchParams: { font?: string }
}) {
	const fonts = await fetch(`${baseUrl}/api/fonts`)
	const response = await fetch(
		`${baseUrl}/api/slides/${params.slide}/frames/${
			params.frame
		}/compact?font=${searchParams.font ?? "Arial"}`,
	)
	const pixel = new Uint8Array(await response.arrayBuffer())
	const pixelArray = Array.from(pixel)
	const frameNumber = parseInt(params.frame)
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			{searchParams.font}
			<Preview
				pixel={pixelArray}
				slide={params.slide}
				frame={frameNumber}
				font={searchParams.font}
			/>
			{((await fonts.json()) as Array<string>).sort().map((font) => (
				<Link
					key={font}
					href={`/${params.slide}/preview/${frameNumber}?font=${font}`}
				>
					{font}
				</Link>
			))}
		</main>
	)
}
