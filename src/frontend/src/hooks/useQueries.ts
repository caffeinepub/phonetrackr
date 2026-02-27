import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AdminActivityEntry,
  type AdminNotice,
  type AdminStats,
  type PhoneStatus,
  type ShoppingItem,
  SubscriptionPlan,
  type TrackedNumber,
  type TrackingEvent,
} from "../backend";
import { useActor } from "./useActor";

// ─── User Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: { plan: SubscriptionPlan }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Tracked Numbers ─────────────────────────────────────────────────────────

export function useGetTrackedNumbers() {
  const { actor, isFetching } = useActor();
  return useQuery<TrackedNumber[]>({
    queryKey: ["trackedNumbers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrackedNumbers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTrackedNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      phoneNumber,
      nickname,
    }: { phoneNumber: string; nickname: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTrackedNumber(phoneNumber, nickname);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedNumbers"] });
    },
  });
}

export function useRemoveTrackedNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (numberId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeTrackedNumber(numberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedNumbers"] });
      queryClient.invalidateQueries({ queryKey: ["fullHistory"] });
    },
  });
}

export function useUpdateNumberStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      numberId,
      status,
    }: { numberId: bigint; status: PhoneStatus }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateNumberStatus(numberId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedNumbers"] });
    },
  });
}

// ─── Tracking Events ──────────────────────────────────────────────────────────

export function useGetFullHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<TrackingEvent[]>({
    queryKey: ["fullHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFullHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTrackingEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      numberId,
      location,
      eventType,
    }: {
      numberId: bigint;
      location: string;
      eventType: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTrackingEvent(numberId, location, eventType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fullHistory"] });
    },
  });
}

// ─── Subscription / Payment ───────────────────────────────────────────────────

export function useGetSubscriptionPlan() {
  const { actor, isFetching } = useActor();
  return useQuery<SubscriptionPlan>({
    queryKey: ["subscriptionPlan"],
    queryFn: async () => {
      if (!actor) return SubscriptionPlan.basic;
      return actor.getSubscriptionPlan();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSubscriptionPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSubscriptionPlan(plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPlan"] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<CheckoutSession> => {
      if (!actor) throw new Error("Actor not available");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }
      return session;
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAdminStats() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAdminStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllActivity(limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<AdminActivityEntry[]>({
    queryKey: ["adminActivity", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActivity(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTrackedNumbers() {
  const { actor, isFetching } = useActor();
  return useQuery<TrackedNumber[]>({
    queryKey: ["adminTrackedNumbers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTrackedNumbers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAdminNotice() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminNotice | null>({
    queryKey: ["adminNotice"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAdminNotice();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAdminNotice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAdminNotice(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNotice"] });
    },
  });
}
