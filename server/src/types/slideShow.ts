import { Area } from "@/src/types/area"

export type SlideShow = {
	id: string
	name: string
	// how many frames to draw on top of each other
	// usefull for more color depths
	// 1 is the default
	chunkSize: number
	areas: Array<Area>
}
