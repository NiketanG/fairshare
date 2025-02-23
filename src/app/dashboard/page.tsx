"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { fetchGroups } from "../../lib/api";

export default function DashboardPage() {
	const { data: groups, isLoading } = useQuery({
		queryKey: ["groups"],
		queryFn: fetchGroups,
	});

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-xl md:text-3xl font-bold">My Groups</h1>
				<Link href="/dashboard/new">
					<Button>
						<PlusIcon className="w-4 h-4" />
						New Group
					</Button>
				</Link>
			</div>

			{!groups || isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(3)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader>
								<div className="h-6 bg-muted rounded w-3/4"></div>
								<div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
							</CardHeader>
							<CardContent>
								<div className="h-4 bg-muted rounded w-1/4"></div>
							</CardContent>
						</Card>
					))}
				</div>
			) : groups.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{groups.map((group) => (
						<Link
							key={group.id}
							href={`/dashboard/groups/${group.id}`}
						>
							<Card className="hover:shadow-lg transition-shadow cursor-pointer">
								<CardHeader>
									<CardTitle className="flex items-center">
										{group.emoji && (
											<span className="mr-2">
												{group.emoji}
											</span>
										)}
										{group.name}
									</CardTitle>
									<CardDescription>
										Created{" "}
										{new Date(
											group.created_at
										).toLocaleDateString()}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{group.created_by_user && (
										<p className="text-sm text-muted-foreground">
											Created by{" "}
											{group.created_by_user?.full_name}
										</p>
									)}
									{group.group_members && (
										<p className="text-sm text-muted-foreground">
											{group.group_members.length} members
										</p>
									)}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card className="text-center py-12">
					<CardHeader>
						<CardTitle>No Groups Yet</CardTitle>
						<CardDescription>
							Create your first group to start splitting expenses
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/dashboard/new">
							<Button>
								<PlusIcon className="w-4 h-4 mr-2" />
								Create First Group
							</Button>
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
