import {Area, AreaContentType} from "@/src/types/area"
import {drawFrame} from "@/src/services/drawFrame"
import {NextApiRequest, NextApiResponse} from "next"
import {toPackedPixel} from "@/src/services/drawFrame.client"
import moment from "moment"
import {MONGO_DB, mongoClient} from "@/src/services/mongo"
import {SlideShow} from "@/src/types/slideShow"


export default async function GET(
    req: NextApiRequest,
    res: NextApiResponse<ReadonlyArray<number>>,
) {


    const frameNumber = parseInt(req.query.frame as string)
    const slideId = req.query.slideId as string
    console.log(`looking for frame ${frameNumber} of slide ${slideId}`)
    await mongoClient.connect()

    const db = mongoClient.db(MONGO_DB)
    const collection = db.collection("slides")

    const slide = await collection.findOne<SlideShow>({ id: slideId })

    if (slide == undefined) {
        console.log("no slide found")
        res.status(404).end()
        return
    }

    console.log("drawing frame")
    const pixel = drawFrame(slide, frameNumber)
    console.log("packing")
    const packed = toPackedPixel(pixel)
    console.log("to buffer")
    const buffer = Buffer.from(packed)
    console.log("out")
    res.write(buffer)
    res.status(200).end()
}
