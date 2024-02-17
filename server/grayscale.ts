import {chain} from "@opencreek/ext";
import {HEIGHT, WIDTH} from "./src/services/drawFrame.client.js";

import sharp from "sharp"
import fs from "fs";
import {PNG} from "pngjs";

const png = new PNG({
    filterType: -1,
    bitDepth: 8,
});

const resizePipe = sharp()
    .resize(128, 128)
    .greyscale()
    .png()

fs.createReadStream("public/in.png")
    .pipe(resizePipe)
    .pipe(png)
    .on("parsed", function () {
        console.log(png.data.length)
        console.log(png.width)
        console.log(png.height)
        console.dir(png)
        const pixel = chain(png.data)
            .chunk(png.width * 4)
            .map(it => chain(it).chunk(4).map(it => it[0]).value())
            .value()

        // const pixel = new Array(128)
        //     .fill(0)
        //     .map((_, y) => new Array(128).fill(0).map((_, x) => x * 2))
        console.dir(pixel)

        const simple = pixel
            .map(row => row.map(toSimpleColor))

        drawSimplePixelToConsole(simple)
        const drawCode = simple
            .map(row => row.map(simpleColor16ToDrawArray))

        const drawPictures = [...new Array(15)]
            .map((_, x) => drawCode.map(row => row.map(it => it[x])))
        const packed = drawPictures.map(toPackedPixel)
        // drawPictures.forEach(it => drawToConsole(it.map(it => it.slice(0, 64))))

        packed.forEach((it, i) => {
            const buffer = Buffer.from(it)
            fs.writeFileSync(`public/test-packed/packed${i}.bin`, buffer)
        })

    });

function drawSimplePixelToConsole(pixel: Array<Array<number>>) {
    console.log(pixel.map(row => row.map(it => it.toString(32)).join("")).join("\n"))

}

function drawToConsole(pixel: Array<Array<boolean>>) {
    console.log(pixel.map(row => row.map(it => it ? "#" : " ").join("")).join("\n"))
}

const packingLength = 8

// console.dir(pixel)
export function toPackedPixel(
    pixel: ReadonlyArray<ReadonlyArray<boolean>>,
): ReadonlyArray<number> {
    const rotated = new Array(WIDTH)
        .fill(0)
        .map((_, x) => new Array(HEIGHT).fill(0).map((_, y) => pixel[y][x]))

    return chain(rotated)
        .flatten()
        .chunk(packingLength)
        .map((chunk) =>
            chunk.reduce(
                (acc, bit, i) => acc | (!bit ? 1 << (packingLength - 1 - i) : 0),
                0,
            ),
        )
        .value()
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

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],

        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],

        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    // console.log(`pixel: ${pixel} => inverse: ${31 - pixel}`)
    const inverted = 15 - pixel
    // @ts-ignore
    if (pixel > 15) {
        console.log(`invalid pixel! pixel: ${pixel} => inverse: ${inverted}`)
    }
    return map[inverted].map((it: number) => it == 1)

}

function simpleColor32ToDrawArray(pixel: number): Array<boolean> {
    const map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    // console.log(`pixel: ${pixel} => inverse: ${31 - pixel}`)
    // @ts-ignore
    return map[(31 - pixel)].map((it: number) => it == 1)

}