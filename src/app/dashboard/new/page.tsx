"use client";

import { GroupForm, GroupFormData } from "@/components/group-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewGroupPage() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (data: GroupFormData) => {
		setIsLoading(true);

		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError) throw userError;
			if (!user) throw new Error("User not found");

			const { data: group, error: groupError } = await supabase
				.from("groups")
				.insert([
					{
						name: data.name.trim(),
						emoji: data.emoji,
						currency: data.currency,
						created_by: user.id,
					},
				])
				.select()
				.single();

			if (groupError) throw groupError;

			// Add creator as member
			const { error: addMemberError } = await supabase
				.from("group_members")
				.insert([
					{
						group_id: group.id,
						full_name:
							user.user_metadata.full_name ||
							user.email?.split("@")[0] ||
							"Anonymous",
						email: user.email,
						user_id: user.id,
					},
				]);

			if (addMemberError) throw addMemberError;

			toast.success("Group created successfully!");
			router.push(`/dashboard/groups/${group.id}`);
		} catch (error) {
			console.error("Error creating group:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create group"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen py-8 bg-gradient-to-br">
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Create New Group</CardTitle>
					<CardDescription>
						Create a new group to track shared expenses
					</CardDescription>
				</CardHeader>
				<CardContent>
					<GroupForm
						onSubmit={handleSubmit}
						submitLabel="Create Group"
						loadingLabel="Creating..."
						onCancel={() => router.back()}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
