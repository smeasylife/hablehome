import { useQuery } from "@tanstack/react-query";
import { getCurrentMember } from "../api/auth";

export const currentMemberQueryKey = ["auth", "me"] as const;

export function useCurrentMember() {
  return useQuery({
    queryKey: currentMemberQueryKey,
    queryFn: getCurrentMember,
    retry: false,
    staleTime: 1000 * 60,
  });
}
