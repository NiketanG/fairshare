import "@/styles/globals.css";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Poppins({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
	title: "FairShare - Split Expenses with Friends",
	description: "Split group expenses easily with friends and family",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.png" sizes="any" />
			</head>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					inter.className
				)}
			>
				<Toaster richColors position="top-right" />
				{children}
				<footer className="container mx-auto pb-6 border-t">
					<p
						className={cn(
							"text-center text-xs text-gray-500",
							"mt-8"
						)}
					>
						Made with ❤️ by{" "}
						<a
							href="https://github.com/NiketanG"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-500"
						>
							Niketan Gulekar
						</a>
					</p>
				</footer>
			</body>
		</html>
	);
}
