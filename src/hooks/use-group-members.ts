import { useQuery } from "@tanstack/react-query";
import { fetchMembers } from "../lib/api";

export function useGroupMembers(groupId: string) {
	const {
		data: members,
		isLoading: loading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["group_members", groupId],
		queryFn: () => fetchMembers(groupId),
	});

	return {
		members: members || [],
		loading,
		error,
		refresh: refetch,
	};
}
