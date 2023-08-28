import React from "react"
import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox-next"
import { PaletteTree } from "./palette"
import RootLayout from "@/src/app/layout"
import Home from "@/src/app/page"
import { Preview } from "@/src/components/Preview"

const ComponentPreviews = () => {
	return (
		<Previews palette={<PaletteTree />}>
			<ComponentPreview path="/RootLayout">
				<RootLayout />
			</ComponentPreview>
			<ComponentPreview path="/Home">
				<Home />
			</ComponentPreview>
			<ComponentPreview path="/Preview">
				<Preview pixel={} />
			</ComponentPreview>
		</Previews>
	)
}

export default ComponentPreviews
