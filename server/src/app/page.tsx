import Image from "next/image"
import { Area, AreaContentType } from "@/src/types/area"
import { drawFrame } from "@/src/services/drawFrame"
import { Preview } from "@/src/components/Preview"
import React, { useState } from "react"
import Link from "next/link"

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<Link href={`/0/preview/0`}>Test</Link>
		</main>
	)
}
