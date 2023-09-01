export type Area = {
	id: string
	x: number
	y: number
	width: number
	height: number
	advanceEveryXFrames: number
	content: Array<AreaContent>
}

export enum AreaContentType {
	Picture = "Picture",
	Text = "Text",
}

export type AreaContent = {
	id: string
	type: AreaContentType
}

export type AreaContentPicture = AreaContent & {
	type: AreaContentType.Picture
	pixel: Array<Array<boolean>>
}

export type AreaContentText = AreaContent & {
	type: AreaContentType.Text
	font?: string
	size: number
	text: string
}
