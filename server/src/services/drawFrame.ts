import {SlideShow} from "@/src/types/slideShow"
import {
    Area,
    AreaContentPicture,
    AreaContentText,
    AreaContentType,
} from "@/src/types/area"
import {chain, error} from "@opencreek/ext"
import "../server/install-fonts"
import {createCanvas, GlobalFonts, SKRSContext2D} from "@napi-rs/canvas"
import {HEIGHT, WIDTH} from "@/src/services/drawFrame.client"

export function drawFrame(
    slideShow: SlideShow,
    frameNumber: number,
    font?: string,
): ReadonlyArray<ReadonlyArray<boolean>> {
    const canvas = createCanvas(WIDTH, HEIGHT)
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = "black"

    slideShow.areas.forEach((area) => {
        drawArea(ctx, frameNumber, area, font)
    })
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)

    return chain(imageData.data)
        .chunk(4)
        .map((pixel) => pixel[0] == 0) // just checking R channel here, but should be good enough right
        .chunk(WIDTH)
        .value()
}

// packs a pixel array into a packed pixel array
// also flips x and y, because the canvas is axactly 128 high

export function drawArea(
    ctx: SKRSContext2D,
    frameNumber: number,
    area: Area,
    font?: string,
) {
    // TODO not advancing every frame)
    const advanceBy = Math.floor(frameNumber / area.advanceEveryXFrames)
    const currentContent = area.content[advanceBy % area.content.length]
    console.dir(area.content)
    console.dir({advanceBy, lentgh: area.content.length})
    switch (currentContent.type) {
        case AreaContentType.Picture:
            drawAreaPicture(ctx, currentContent as AreaContentPicture, area)
            break
        case AreaContentType.Text:
            drawAreaText(ctx, currentContent as AreaContentText, area, font)
            break
    }
}

function drawAreaPicture(
    ctx: SKRSContext2D,
    areaContent: AreaContentPicture,
    area: Area,
) {
    areaContent.pixel.forEach((row, x) => {
        row.forEach((pixel, y) => {
            if (pixel) {
                ctx.fillStyle = "black"
                ctx.fillRect(x + area.x, y + area.y, 1, 1)
            } else if (pixel === false) {
                ctx.fillStyle = "white"
                ctx.fillRect(x + area.x, y + area.y, 1, 1)
            }
            // else pixel is undefined, so we don't draw anything, transparency babyyyy
        })
    })
}

function drawAreaText(
    ctx: SKRSContext2D,
    areaContent: AreaContentText,
    area: Area,
    font?: string,
) {
    ctx.font = `${areaContent.size}px ${areaContent.font ?? font ?? "pixelmix"}`
    ctx.fillStyle = "black"
    ctx.strokeText(areaContent.text, area.x, area.y, area.width)
    ctx.fillText(areaContent.text, area.x, area.y, area.width)
}

function getTotalFrames(slide: SlideShow): number {
    const cycles = slide.areas.map(
        (it) => it.advanceEveryXFrames * it.content.length,
    )
    return lcm(...cycles)
}

function lcm(...arr: number[]): number {
    const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y))
    const _lcm = (x: number, y: number) => (x * y) / gcd(x, y)
    return [...arr].reduce((a, b) => _lcm(a, b))
}


export function grayScaleToDrawInstructions(
    pixel: ReadonlyArray<ReadonlyArray<number>>,
): Array<Array<Array<boolean>>> {
    const base = pixel.map((row) => row.map(toSimpleColor))
    const simple = ditherToSimpleColor(pixel)
    const diff = base.map((row, y) => row.map((it, x) => it - simple[y][x] + 16))
    console.log("base")
    drawSimplePixelToConsole(base)
    console.log("simple")
    drawSimplePixelToConsole(simple)
    console.log("diff")
    drawSimplePixelToConsole(diff)

    const drawCode = simple.map((row) => row.map(simpleColor16ToDrawArray))

    const drawPictures = [...new Array(15)].map((_, x) =>
        drawCode.map((row) => row.map((it) => it[x])),
    )

    return drawPictures
}


const jjn = {
    offset: 3,
    divisor: 48,
    array: [
        [0, 0, 0, 7, 5],
        [3, 5, 7, 5, 3],
        [1, 3, 5, 3, 1]
    ]
}

const availableColors= [
    255,
    250,
    240,
    235,
    230,
    227,
    221,

    101,
    70,
    55,
    45,
    38,
    30,
    20,
    10,
    0
]
// const availableColors = [
//     0,
//     10,
//     20,
//     30,
//     38,
//     45,
//     55,
//     70,
//     101,
//
//
//     221,
//     227,
//     230,
//     235,
//     240,
//     250,
//     255
// ]

function quantizeToColor(pixel: number, correction: number): number {
    const projected = pixel + correction
    // @ts-ignore
    const quantized = chain(availableColors).minBy((it) => Math.abs(it - projected)) ?? correction("no color found")
    return quantized

}

function ditherToSimpleColor(pixels: ReadonlyArray<ReadonlyArray<number>>): ReadonlyArray<ReadonlyArray<number>> {
    const errors = pixels.map((row) => row.map(() => 0))
    return pixels.map((row, y) => row.map((pixel, x) => {
        const correction = errors[y][x]
        const quantized = quantizeToColor(pixel, correction)
        const error = pixel - quantized
        const dither = jjn
        jjn.array.forEach((row, dy) => row.forEach((it, dx) => {
            const value = (error / dither.divisor) * it
            const rx = x + dx - dither.offset
            const ry = y + dy
            if (rx >= 0 && rx < pixels[0].length && ry >= 0 && ry < pixels.length) {
                errors[ry][rx] += value
            }
        }))
        const simple = availableColors.indexOf(quantized)
        return simple
    }))
}

function drawSimplePixelToConsole(pixel: ReadonlyArray<ReadonlyArray<number>>) {
    console.log(
        pixel.map((row) => row.map((it) => it.toString(32)).join("")).join("\n"),
    )
}

function toSimpleColor(grayScale: number): number {
    // console.log(`pixel: ${pixel} => ${pixel >> 3}`)
    return grayScale >> 4
}

function simpleColor16ToDrawArray(pixel: number): Array<boolean> {
    const map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],

        [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],

        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],

        [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    const inverted = 15 - pixel
    if (pixel > 15) {
        console.log(`invalid pixel! pixel: ${pixel} => inverse: ${inverted}`)
    }
    return map[inverted].map((it: number) => it == 1)
}
