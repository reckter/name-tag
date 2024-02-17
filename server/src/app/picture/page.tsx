"use client"
import { useState } from "react"

export default function UploadPicture() {

    const slideId= "c53a8af4-f51b-49b5-935d-b2bfe064a82a"
    const [file, setFile] = useState<File>()

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!file) return

        try {
            const data = new FormData()
            data.set('file', file)

            const res = await fetch(`/api/slides/${slideId}/areas/detail-picture/update-with-grayscale-picture`, {
                method: 'POST',
                body: data
            })
            // handle the error
            if (!res.ok) throw new Error(await res.text())
        } catch (e: any) {
            // Handle errors here
            console.error(e)
        }
    }


    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <form onSubmit={onSubmit}>
                <input
                    type="file"
                    name="file"
                    onChange={(e) => setFile(e.target.files?.[0])}
                />
                <input type="submit" value="Upload"/>
            </form>
        </main>
    )
}