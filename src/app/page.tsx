"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CredentialResponse } from "google-one-tap";
import Script from "next/script";

export default function SignInPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const [oneTapLoaded, setOneTapLoaded] = useState(false);
	const router = useRouter();

	// generate nonce to use for google id token sign-in
	const generateNonce = async (): Promise<string[]> => {
		const nonce = btoa(
			String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
		);
		const encoder = new TextEncoder();
		const encodedNonce = encoder.encode(nonce);
		const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashedNonce = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return [nonce, hashedNonce];
	};

	const checkSession = async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session) {
				router.replace("/dashboard");
				return true;
			}
		} catch (error) {
			console.error("Error checking session:", error);
			return false;
		} finally {
			setIsChecking(false);
		}
	};

	useEffect(() => {
		const initializeGoogleOneTap = async () => {
			const [nonce, hashedNonce] = await generateNonce();

			// check if there's already an existing session before initializing the one-tap UI
			const session = await checkSession();
			if (session) {
				return;
			}

			if (google) {
				/* global google */
				google.accounts.id.initialize({
					client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
					callback: async (response: CredentialResponse) => {
						try {
							// send id token returned in response.credential to supabase
							const { data, error } =
								await supabase.auth.signInWithIdToken({
									provider: "google",
									token: response.credential,
									nonce,
								});

							if (error) throw error;

							// redirect to protected page
							router.push("/dashboard");
						} catch (error) {
							console.error(
								"Error logging in with Google One Tap",
								error
							);
						}
					},
					nonce: hashedNonce,
					// with chrome's removal of third-party cookiesm, we need to use FedCM instead (https://developers.google.com/identity/gsi/web/guides/fedcm-migration)
					use_fedcm_for_prompt: true,
				});
				google.accounts.id.prompt(); // Display the One Tap UI
			}
		};

		if (document.readyState === "complete") {
			initializeGoogleOneTap();
		} else {
			window.addEventListener("load", initializeGoogleOneTap);
			return () =>
				document.removeEventListener("load", initializeGoogleOneTap);
		}
	}, [oneTapLoaded]);

	const handleSignIn = async () => {
		try {
			setIsLoading(true);
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) throw error;
		} catch (error) {
			console.error("Error signing in:", error);
			toast.error("Failed to sign in with Google");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
			<Script
				src="https://accounts.google.com/gsi/client"
				strategy="beforeInteractive"
				onLoad={() => setOneTapLoaded(true)}
			/>
			<div id="oneTap" className="fixed top-0 right-0 z-[100]" />

			{isChecking ? (
				<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<Card className="w-[380px] shadow-lg">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl font-bold">
							Welcome to FairShare
						</CardTitle>
						<CardDescription>
							Split expenses with friends, hassle-free
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-center">
							<div className="rounded-full p-8 bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="w-12 h-12 text-primary"
								>
									<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
								</svg>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							className="w-full h-12 text-base"
							variant="outline"
							onClick={handleSignIn}
						>
							<FcGoogle className="mr-2 h-5 w-5" />
							Sign in with Google
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	);
}
