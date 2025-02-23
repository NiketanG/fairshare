import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "FairShare - Bill Splitting",
		short_name: "FairShare",
		description: "Bill splitting made easy",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		icons: [
			{
				src: "/favicon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/favicon-512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
