/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {},
	webpack: (config, { isServer }) => {
		config.externals["@napi-rs/canvas"] = "@napi-rs/canvas"
		return config
	},
}
// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
if (
	process.env.LD_LIBRARY_PATH == null ||
	!process.env.LD_LIBRARY_PATH.includes(
		`${process.env.PWD}/node_modules/canvas/build/Release:`,
	)
) {
	process.env.LD_LIBRARY_PATH = `${
		process.env.PWD
	}/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ""}`
}

module.exports = nextConfig
