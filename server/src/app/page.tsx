import Image from "next/image"
import {Area, AreaContentType} from "@/src/types/area"
import {drawFrame} from "@/src/services/drawFrame"
import {Preview} from "@/src/components/Preview"
import React, {useState} from "react"
import Link from "next/link"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <ul>
                <li className="pb-8">

                    <Link href={`/picture?slide=a52d839d-2e88-48f1-9355-a852b8f5111b`}>with name</Link>
                </li>
                <li>

                    <Link href={`/picture?slide=31697112-f46a-4677-b3e1-1c056430e3c6`}>big picture</Link>
                </li>
            </ul>
        </main>
    )
}
