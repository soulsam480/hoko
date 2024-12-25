import { defineConfig, Plugin } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

function SQLiteDevPlugin(): Plugin {
	return {
		name: "configure-response-headers",
		configureServer: (server) => {
			server.middlewares.use((_req, res, next) => {
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				next();
			});
		},
	};
}

export default defineConfig({
	plugins: [
		preact(),
		SQLiteDevPlugin(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
			workbox: {
				globPatterns: ["**/*.{js,css,html,json,svg,png,ico,wasm}"],
			},
			manifest: {
				name: "Byoga",
				short_name: "Byoga",
				description: "IDFC Bank statement analyzer and visualizer",
				theme_color: "#14A670",
				background_color: "#14A670",
				icons: [
					// {
					//   src: 'pwa-64x64.png',
					//   sizes: '64x64',
					//   type: 'image/png',
					// },
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "pwa-maskable-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "pwa-maskable-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
	],
	build: {
		target: "esnext",
		minify: "esbuild",
		cssMinify: "lightningcss",
	},
	resolve: {
		dedupe: ["preact"],
		alias: [
			{ find: "react", replacement: "preact/compat" },
			{ find: "react-dom/test-utils", replacement: "preact/test-utils" },
			{ find: "react-dom", replacement: "preact/compat" },
			{ find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
		],
	},
	// optimizeDeps: {
	// 	exclude: ["sqlocal"],
	// },
});