import {MONGO_DB, mongoClient} from "@/src/services/mongo"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url)
    const user = searchParams.get("user")

    const db = mongoClient.db(MONGO_DB)
    const collection = db.collection("slides")
    
    const result = await collection.find({user: user}).toArray()
    return NextResponse.json(result)
}
