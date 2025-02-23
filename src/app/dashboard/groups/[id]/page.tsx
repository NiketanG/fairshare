"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrencySymbol } from "@/components/ui/currency-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroup } from "@/hooks/use-group";
import { useGroupMembers } from "@/hooks/use-group-members";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";
import { ArrowLeft, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import {
	useRouter as useNavigationRouter,
	useRouter,
	useSearchParams,
} from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { GroupForm } from "../../../../components/group-form";
import { Balance, Expense } from "../../../../types";
import { useQuery } from "@tanstack/react-query";
import { fetchExpenses } from "../../../../lib/api";

type GroupFormData = {
	name: string;
	emoji: string;
	currency: string;
};

export default function GroupPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { group, loading: groupLoading, updateGroup } = useGroup(id);
	const {
		members,
		loading: membersLoading,
		error: membersError,
	} = useGroupMembers(id);
	const { user } = useUser();
	const router = useRouter();
	const navigationRouter = useNavigationRouter();
	const searchParams = useSearchParams();
	const defaultTab = searchParams.get("tab") || "expenses";
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const { data: expenses, isLoading: loading } = useQuery({
		queryKey: ["expenses", id],
		queryFn: () => fetchExpenses(id, members),
	});

	// Show error if members fetch failed
	useEffect(() => {
		if (membersError) {
			toast.error("Failed to load members");
		}
	}, [membersError]);

	const handleDeleteMember = async (memberId: string) => {
		try {
			const { error } = await supabase
				.from("group_members")
				.delete()
				.eq("id", memberId);

			if (error) throw error;

			toast.success("Member removed successfully");
			router.refresh();
		} catch (error) {
			console.error("Error removing member:", error);
			toast.error("Failed to remove member");
		}
	};

	const handleDeleteGroup = () => {
		setShowDeleteModal(true);
	};

	const onDeleteGroup = async () => {
		try {
			const { error } = await supabase
				.from("groups")
				.delete()
				.eq("id", id);

			if (error) throw error;

			toast.success("Group deleted successfully");
			navigationRouter.push("/dashboard");
		} catch (error) {
			console.error("Error deleting group:", error);
			toast.error("Failed to delete group");
		}
	};

	const handleEditGroup = async (data: GroupFormData) => {
		try {
			await updateGroup({
				name: data.name,
				emoji: data.emoji,
				currency: data.currency,
			});
		} catch (error) {
			// Error is already handled by updateGroup
		}
	};

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("tab", value);
		navigationRouter.push(`/dashboard/groups/${id}?${params.toString()}`);
	};

	// Update loading state to consider both group and members loading
	if (loading || groupLoading || membersLoading) {
		return (
			<div className="container mx-auto py-8 animate-pulse">
				<div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
				<div className="h-[400px] bg-muted rounded"></div>
			</div>
		);
	}

	if (!group) {
		return (
			<div className="container mx-auto py-8">
				<Card className="p-6 text-center">
					<h2 className="text-lg font-semibold mb-2">
						Group not found
					</h2>
					<p className="text-muted-foreground mb-4">
						This group may have been deleted or you don't have
						access to it.
					</p>
					<Link href="/dashboard">
						<Button>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-3">
					<Link href="/dashboard">
						<Button variant="ghost">
							<ArrowLeft className="w-4 h-4" />
						</Button>
					</Link>
					<h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
						<span>{group.emoji}</span>
						{group.name}
					</h1>
					{group.created_by === user?.id && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="ml-2"
								>
									<Pencil className="w-4 h-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Edit Group
									</AlertDialogTitle>
								</AlertDialogHeader>
								<GroupForm
									defaultValues={{
										name: group.name,
										emoji: group.emoji,
										currency: group.currency,
									}}
									onSubmit={async (data) => {
										await handleEditGroup(data);
										const closeButton =
											document.querySelector(
												"[data-close-dialog]"
											) as HTMLButtonElement;
										closeButton?.click();
									}}
									submitLabel="Save Changes"
									loadingLabel="Saving..."
									isDialog={true}
								/>
								<AlertDialogFooter>
									<AlertDialogCancel>Close</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDeleteGroup}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}

					<AlertDialog
						open={showDeleteModal}
						onOpenChange={setShowDeleteModal}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Delete Group
								</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this group?
									This action cannot be undone. All expenses
									and members will be deleted.
								</AlertDialogDescription>
							</AlertDialogHeader>

							<AlertDialogFooter>
								<AlertDialogCancel>Close</AlertDialogCancel>
								<AlertDialogAction
									onClick={onDeleteGroup}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<Tabs
				defaultValue={defaultTab}
				className="space-y-4 "
				onValueChange={handleTabChange}
			>
				<div className="max-w-full overflow-x-auto">
					<TabsList className="">
						<TabsTrigger value="expenses">Expenses</TabsTrigger>
						<TabsTrigger value="members">Members</TabsTrigger>
						<TabsTrigger value="balances">Balances</TabsTrigger>
						<TabsTrigger value="payments">Payments</TabsTrigger>
						<TabsTrigger value="summary">Summary</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="expenses" className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold">Expenses</h2>
						<Link href={`/dashboard/groups/${id}/expenses/new`}>
							<Button>
								<Plus className="w-4 h-4 mr-2" />
								Add Expense
							</Button>
						</Link>
					</div>
					<div className="flex flex-col space-y-4">
						{expenses?.expenses?.map((expense) => (
							<Link
								href={`/dashboard/groups/${id}/expenses/${expense.id}`}
								key={expense.id}
							>
								<Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">
												{expense.description}
											</p>
											<p className="text-sm text-muted-foreground">
												Paid by{" "}
												{
													expense.paid_by_member
														?.full_name
												}{" "}
												•{" "}
												{new Date(
													expense.created_at
												).toLocaleDateString()}
											</p>
										</div>
										<p className="font-medium">
											{getCurrencySymbol(group.currency)}{" "}
											{expense.amount.toFixed(2)}
										</p>
									</div>
								</Card>
							</Link>
						))}
						{expenses?.expenses?.length === 0 && (
							<Card className="p-6 text-center">
								<p className="text-muted-foreground mb-4">
									No expenses yet
								</p>
								<Link
									href={`/dashboard/groups/${id}/expenses/new`}
								>
									<Button>
										<Plus className="w-4 h-4 mr-2" />
										Add First Expense
									</Button>
								</Link>
							</Card>
						)}
					</div>
				</TabsContent>

				<TabsContent value="members" className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold">
							Members ({members.length})
						</h2>
						<Link href={`/dashboard/groups/${id}/members/new`}>
							<Button>
								<UserPlus className="w-4 h-4 mr-2" />
								Add Member
							</Button>
						</Link>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{members.map((member) => (
							<Card key={member.id} className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{member.profile?.avatar_url ? (
											<img
												src={member.profile.avatar_url}
												alt={member.full_name}
												className="w-10 h-10 rounded-full"
											/>
										) : (
											<div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
												{getInitials(member.full_name)}
											</div>
										)}
										<div>
											<p className="font-medium">
												{member.full_name}
											</p>
											{(member.profile?.email ||
												member.email) && (
												<p className="text-sm text-muted-foreground">
													{member.profile?.email ||
														member.email}
												</p>
											)}
										</div>
									</div>
									{group.created_by === user?.id &&
										member.user_id !== user?.id && (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="text-destructive"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Remove Member
														</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you
															want to remove{" "}
															{member.full_name}{" "}
															from the group? This
															will also remove
															their expense
															history.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Cancel
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																handleDeleteMember(
																	member.id
																)
															}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														>
															Remove
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
								</div>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="payments" className="space-y-4">
					<h2 className="text-xl font-semibold">Payments</h2>
					<Card className="p-6">
						<div>
							<div className="space-y-2">
								{members.map((member) => {
									const totalPaid = expenses?.expenses
										?.filter(
											(exp) => exp.paid_by === member.id
										)
										.reduce(
											(sum, exp) => sum + exp.amount,
											0
										);

									if (totalPaid === 0) return null;

									return (
										<div
											key={member.id}
											className="flex items-center justify-between text-sm"
										>
											<span className="font-medium">
												{member.full_name}
											</span>
											<span className="text-muted-foreground">
												paid{" "}
												{getCurrencySymbol(
													group.currency
												)}{" "}
												{totalPaid.toFixed(2)}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="balances" className="space-y-4">
					<h2 className="text-xl font-semibold">Balances</h2>
					<Card className="p-6">
						<div>
							<div className="space-y-2">
								{expenses?.balances &&
								expenses?.balances?.length > 0 ? (
									expenses?.balances.map((balance, index) => {
										const fromMember = members.find(
											(m) => m.id === balance.from
										);
										const toMember = members.find(
											(m) => m.id === balance.to
										);
										return (
											<div
												key={index}
												className="flex items-center justify-between text-sm"
											>
												<span>
													<span className="font-medium">
														{fromMember?.full_name}
													</span>
													<span className="text-muted-foreground">
														{" "}
														owes{" "}
													</span>
													<span className="font-medium">
														{toMember?.full_name}
													</span>
												</span>
												<span className="font-medium">
													{getCurrencySymbol(
														group.currency
													)}{" "}
													{balance.amount.toFixed(2)}
												</span>
											</div>
										);
									})
								) : (
									<p className="text-muted-foreground">
										All settled up!
									</p>
								)}
							</div>
						</div>
					</Card>
				</TabsContent>
				<TabsContent value="summary" className="space-y-4">
					<h2 className="text-xl font-semibold">Summary</h2>
					<Card className="p-6">
						<div className="space-y-4">
							<div className="flex justify-between">
								<div className="w-1/2">
									<h3 className="font-medium mb-2">
										Total Expenses
									</h3>
									<p className="text-2xl font-bold">
										{getCurrencySymbol(group.currency)}{" "}
										{expenses?.expenses
											?.reduce(
												(sum, exp) => sum + exp.amount,
												0
											)
											.toFixed(2)}
									</p>
								</div>
								<div className="w-1/2">
									<h3 className="font-medium mb-2">
										Member Count
									</h3>
									<p className="text-2xl font-bold">
										{members.length}
									</p>
								</div>
							</div>

							<div>
								<h3 className="font-medium">Created On</h3>
								<p className="text-muted-foreground">
									{new Date(
										group.created_at
									).toLocaleDateString()}
								</p>
							</div>
						</div>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
