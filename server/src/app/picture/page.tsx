"use client"
import {useQueryState, queryTypes} from "next-usequerystate"
import Link from "next/link"
import {useState} from "react"

export default function UploadPicture() {
    const [slideId] = useQueryState<string>(
        "slide",
        queryTypes.string.withDefault("c53a8af4-f51b-49b5-935d-b2bfe064a82a"),
    )
    const [areaId] = useQueryState<string>(
        "area",
        queryTypes.string.withDefault("detail-picture"),
    )
    const [file, setFile] = useState<File>()
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState("dither")

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!file) return
        setIsLoading(true)

        try {
            const data = new FormData()
            data.set("file", file)

            const res = await fetch(
                `/api/slides/${slideId}/areas/${areaId}/update-with-grayscale-picture?mode=${mode}`,
                {
                    method: "POST",
                    body: data,
                },
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

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <Link href="/">Back</Link>
            <div className="flex flex-row items-center justify-between p-2">
                <input type="checkbox" id="mode" checked={mode === "dither"} onChange={(e) => {
                    if (e.target.checked) {
                        setMode("dither")
                    } else {
                        setMode("simple")
                    }
                }}/>
                <label htmlFor={"mode"}>Dither</label>
            </div>
            <form onSubmit={onSubmit}>
                <input
                    type="file"
                    name="file"
                    onChange={(e) => setFile(e.target.files?.[0])}
                />
                <input
                    type="submit"
                    value="Upload"
                    style={{
                        padding: "12px",
                        marginTop: "12px",
                        border: "1px solid #eaeaea",
                    }}
                />
                {isLoading && <p>Loading...</p>}
            </form>
        </main>
    )
}
