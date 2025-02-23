"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		async function loadProfile() {
			try {
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();
				if (userError) throw userError;

				if (!user) {
					console.log("No user found");
					return;
				}

				// Try to get existing profile
				const { data: profile, error: fetchError } = await supabase
					.from("profiles")
					.select("*")
					.eq("id", user.id)
					.single();

				if (fetchError) {
					if (fetchError.code === "PGRST116") {
						// Record not found

						const newProfileData = {
							id: user.id,
							full_name: user.user_metadata.full_name,
							avatar_url: user.user_metadata.avatar_url,
							email: user.email,
						};

						const { data: newProfile, error: insertError } =
							await supabase
								.from("profiles")
								.insert([newProfileData])
								.select()
								.single();

						if (insertError) {
							console.error(
								"Failed to insert profile:",
								insertError
							);
							throw insertError;
						}

						setProfile(newProfile);
						toast.success("Profile created successfully");
					} else {
						console.error("Error fetching profile:", fetchError);
						throw fetchError;
					}
				} else {
					console.log("Existing profile found:", profile);
					setProfile(profile);
				}
			} catch (error) {
				console.error("Error in profile management:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to load user profile"
				);
			} finally {
				setLoading(false);
			}
		}

		loadProfile();
	}, []);

	const handleSignOut = async () => {
		try {
			await supabase.auth.signOut();
			router.replace("/");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b">
				<div className="container mx-auto py-4 px-6 md:px-0">
					<div className="flex justify-between items-center">
						<Link href="/dashboard">
							<h1 className="text-xl md:text-2xl font-bold">
								FairShare
							</h1>
						</Link>
						<div className="flex items-center space-x-4">
							<Button
								variant="outline"
								size="sm"
								onClick={handleSignOut}
							>
								Sign Out
							</Button>
							{loading ? (
								<Skeleton className="w-6 h-6 md:h-10 md:w-10 rounded-full" />
							) : (
								<Avatar>
									<AvatarImage
										src={profile?.avatar_url || undefined}
									/>
									<AvatarFallback>
										{profile?.full_name?.[0]?.toUpperCase() ||
											"?"}
									</AvatarFallback>
								</Avatar>
							)}
						</div>
					</div>
				</div>
			</header>
			<main className="px-6 md:px-0">{children}</main>
		</div>
	);
}
