import {MONGO_DB, mongoClient} from "@/src/services/mongo"
import {Area, AreaContentType} from "@/src/types/area"
import moment from "moment"
import {NextResponse} from "next/server"

function random(max: number) {
    return Math.floor(Math.random() * max)
}

export async function GET(request: Request) {

    const {searchParams} = new URL(request.url)

    const content = {
        id: "content",
        type: AreaContentType.Text,
        size: 21,
        text: "Hello World",
        font: "5x7 practical",
    }
    const content2 = {
        id: "content",
        type: AreaContentType.Text,
        size: 20 + random(5),
        text: "toki!",
    }
    const areaText: Area = {
        id: "area",
        x: random(30),
        y: 16 + random(10),
        width: 269,
        height: 100,
        advanceEveryXFrames: 1,
        content: [content, content2],
    }
    const countContent = (frameNumber: number) => ({
        id: "content",
        type: AreaContentType.Text,
        size: 27 + random(5),
        text: frameNumber.toString() + ": " + moment().format("MM-DD HH:mm:ss"),
    })
    const countText: Area = {
        id: "count",
        x: random(10),
        y: 60 + random(10),
        width: 296,
        height: 100,
        advanceEveryXFrames: 1,
        content: [...new Array(10000).map((_, it) => countContent(it))],
    }
    const sizeBlackSquare = 5 + random(20)
    const contentBlackSquare = {
        id: "content",
        type: AreaContentType.Picture,
        pixel: [
            ...new Array(sizeBlackSquare).fill(new Array(sizeBlackSquare).fill(true)),
        ],
    }
    const sizeBigBlackSquare = 30 + random(40)
    const contentBlackSquareLowerCorner = {
        id: "content",
        type: AreaContentType.Picture,
        pixel: [
            ...new Array(100)
                .fill(true)
                .map((_, x) =>
                    new Array(100)
                        .fill(true)
                        .map(
                            (_, y) =>
                                x > 100 - sizeBigBlackSquare && y > 100 - sizeBigBlackSquare,
                        ),
                ),
        ],
    }
    const areaImage: Area = {
        id: "area2",
        x: 200 + random(40),
        y: 10 + random(10),
        width: 100,
        height: 100,
        advanceEveryXFrames: 2,
        content: [contentBlackSquare, contentBlackSquareLowerCorner],
    }
    const slide = {
        id: "slide",
        name: "hello world",
        areas: [areaText, areaImage, countText],
    }

    const db = mongoClient.db(MONGO_DB)
    const collection = db.collection("slides")

    const response = await collection.insertOne(slide)

    return NextResponse.json(response)
}