import { Preview } from "@/src/components/Preview"

const baseUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000"
export default async function PreviewFrame({
	params,
}: {
	params: { slide: string; frame: string }
}) {
	const response = await fetch(
		`${baseUrl}/api/slide/${params.slide}/frame/${params.frame}/compact`,
	)
	const pixel = new Uint8Array(await response.arrayBuffer())
	const frameNumber = parseInt(params.frame)
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<Preview pixel={pixel} slide={params.slide} frame={frameNumber} />
		</main>
	)
}
