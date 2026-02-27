import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TrackingEvent {
    id: bigint;
    user: Principal;
    timestamp: bigint;
    phoneNumber: string;
    location: string;
    eventType: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TrackedNumber {
    id: bigint;
    status: PhoneStatus;
    nickname: string;
    user: Principal;
    phoneNumber: string;
    dateAdded: bigint;
}
export interface AdminStats {
    totalTracks: bigint;
    totalEvents: bigint;
    totalUsers: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface AdminNotice {
    updatedAt: bigint;
    message: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    plan: SubscriptionPlan;
}
export interface AdminActivityEntry {
    id: bigint;
    action: string;
    user: Principal;
    timestamp: bigint;
    phoneNumber: string;
}
export enum PhoneStatus {
    active = "active",
    pending = "pending",
    inactive = "inactive"
}
export enum SubscriptionPlan {
    pro = "pro",
    premium = "premium",
    basic = "basic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrackedNumber(phoneNumber: string, nickname: string): Promise<bigint>;
    addTrackingEvent(numberId: bigint, location: string, eventType: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    getAdminNotice(): Promise<AdminNotice | null>;
    getAdminStats(): Promise<AdminStats>;
    getAllActivity(limit: bigint): Promise<Array<AdminActivityEntry>>;
    getAllTrackedNumbers(): Promise<Array<TrackedNumber>>;
    getAllUsers(): Promise<Array<Principal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFullHistory(): Promise<Array<TrackingEvent>>;
    getNumberHistory(numberId: bigint): Promise<Array<TrackingEvent>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscriptionPlan(): Promise<SubscriptionPlan>;
    getTrackedNumbers(): Promise<Array<TrackedNumber>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    removeTrackedNumber(numberId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminNotice(message: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setSubscriptionPlan(plan: SubscriptionPlan): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateNumberStatus(numberId: bigint, status: PhoneStatus): Promise<void>;
}
