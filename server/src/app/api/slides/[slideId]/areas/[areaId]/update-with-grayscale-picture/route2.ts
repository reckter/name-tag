
import {grayScaleToDrawInstructions} from "@/src/services/drawFrame"
import {MONGO_DB, mongoClient} from "@/src/services/mongo"
import {AreaContentPicture, AreaContentType} from "@/src/types/area"
import {SlideShow} from "@/src/types/slideShow"
import {chain} from "@opencreek/ext"
import {NextResponse} from "next/server"
import {PNG} from "pngjs"
import sharp from "sharp"

export async function POST(request: Request, {params}:   {params: {slideId: string, areaId: string}}) {
    const slideId = params.slideId
    const areaId = params.areaId

    const formData = await request.formData()
    const file: File | null = formData.get('file') as unknown as File

    const png = new PNG()
    const scaled = sharp(await file.arrayBuffer())
        .resize(128, 128)
        .greyscale()
        .png()

    const buffer = await scaled.toBuffer()
    const data = await new Promise<PNG>((accept) => {
        png.parse(buffer, (err, data) => {
            accept(data)
        })
    })

    const pixel = chain(data.data)
        .chunk(data.width * 4)
        .map(it => chain(it).chunk(4).map(it => it[0]).value())
        .value()

    const instructions = grayScaleToDrawInstructions(pixel)

    const db = mongoClient.db(MONGO_DB)
    const collection = db.collection("slides")

    const slide = await collection.findOne<SlideShow>({id: slideId})
    if (slide == undefined) {
        return NextResponse.json({error: "no slide found"})
    }

    const area = slide.areas
        .find((it) => it.id === areaId)
    if (area == undefined) {
        return NextResponse.json({error: "no area found"})
    }
    area.content = instructions
        .map((it, index) => {
            return {
                type: AreaContentType.Picture,
                id: index.toString(),
                pixel: it
            } satisfies AreaContentPicture
        })

    await collection.updateOne({id: slide.id}, {$set: {areas: slide.areas}})
    const ret = await collection.findOne({id: slide.id})
    console.dir(ret)

    return NextResponse.json(ret)
}
