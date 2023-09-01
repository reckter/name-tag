import { GlobalFonts } from "@napi-rs/canvas"
import fs from "fs"
const fontDir = path.join(process.cwd(), 'public/fonts');
import path from 'path';
const bitfont = fs.readFileSync(`${fontDir}/bitfont.ttf`)
// import bitfont from "../../public/fonts/bitfont.ttf"
// GlobalFonts.register(bitfont, 'Bitfont')
GlobalFonts.loadFontsFromDir(fontDir)
console.log(GlobalFonts.has('Bitfont'))
