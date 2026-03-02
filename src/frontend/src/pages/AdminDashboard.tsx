import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Loader2,
  LogOut,
  Megaphone,
  Phone,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAdminNotice,
  useGetAdminStats,
  useGetAllActivity,
  useGetAllTrackedNumbers,
  useSetAdminNotice,
} from "../hooks/useQueries";

function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleString();
}

function truncatePrincipal(principal: { toString: () => string }): string {
  const str = principal.toString();
  return `${str.slice(0, 8)}...`;
}

export default function AdminDashboard() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [noticeText, setNoticeText] = useState("");
  const [noticeSaved, setNoticeSaved] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetAdminStats();
  const {
    data: activity,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useGetAllActivity(50n);
  const {
    data: trackedNumbers,
    isLoading: numbersLoading,
    refetch: refetchNumbers,
  } = useGetAllTrackedNumbers();
  const { data: adminNotice, isLoading: noticeLoading } = useGetAdminNotice();
  const setAdminNotice = useSetAdminNotice();

  // Pre-fill notice text when loaded
  useEffect(() => {
    if (adminNotice?.message) {
      setNoticeText(adminNotice.message);
    }
  }, [adminNotice]);

  // Auto-refresh every 30 seconds
  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchActivity();
    refetchNumbers();
    setLastRefresh(new Date());
  }, [refetchStats, refetchActivity, refetchNumbers]);

  useEffect(() => {
    const interval = setInterval(handleRefresh, 30_000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const handleSaveNotice = async () => {
    try {
      await setAdminNotice.mutateAsync(noticeText);
      queryClient.invalidateQueries({ queryKey: ["adminNotice"] });
      setNoticeSaved(true);
      toast.success("Notice broadcast to all users!");
      setTimeout(() => setNoticeSaved(false), 3000);
    } catch {
      toast.error("Failed to save notice");
    }
  };

  const handleBackToApp = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    handleBackToApp();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-red flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">
                  PhoneTrackr Admin
                </h1>
                <p className="text-xs text-muted-foreground leading-none">
                  Control Panel
                </p>
              </div>
              <Badge className="ml-1 bg-emerald-100 text-emerald-700 border-0 text-[10px] px-2 py-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block animate-pulse" />
                LIVE
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {lastRefresh.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToApp}
                className="gap-1.5 text-xs h-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to App</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Users
                </Badge>
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-16 mb-1" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalUsers?.toString() ?? "0"}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          {/* Total Tracks */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Tracks
                </Badge>
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-16 mb-1" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalTracks?.toString() ?? "0"}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Numbers tracked
              </p>
            </CardContent>
          </Card>

          {/* Total Events */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Events
                </Badge>
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-16 mb-1" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalEvents?.toString() ?? "0"}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Total events logged
              </p>
            </CardContent>
          </Card>

          {/* Live Status */}
          <Card className="border-border shadow-sm bg-gradient-to-br from-card to-primary-light">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">Live</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                System operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Activity Feed - takes 2/3 width */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Recent Activity Feed
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    Last 50 entries
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-4 w-28 shrink-0" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : !activity || activity.length === 0 ? (
                  <div className="py-12 text-center">
                    <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No activity recorded yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="text-xs font-semibold text-muted-foreground w-36">
                            Time
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground">
                            Phone Number
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground">
                            Action
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground">
                            User
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activity.map((entry) => (
                          <TableRow
                            key={entry.id.toString()}
                            className="hover:bg-secondary/30 transition-colors"
                          >
                            <TableCell className="text-xs text-muted-foreground py-2.5 font-mono">
                              {formatTimestamp(entry.timestamp)}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-foreground py-2.5 font-mono">
                              {entry.phoneNumber}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <Badge
                                className={`text-[10px] px-1.5 py-0 font-semibold border-0 ${
                                  entry.action === "track"
                                    ? "bg-blue-100 text-blue-700"
                                    : entry.action === "event"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {entry.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2.5 font-mono">
                              {truncatePrincipal(entry.user)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Notice + Broadcast */}
          <div className="space-y-4">
            {/* Broadcast Notice */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  Broadcast Notice
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Message displayed to all users on dashboard
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {noticeLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <>
                    <Textarea
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                      placeholder="Enter a notice message for all users..."
                      className="text-sm resize-none h-24 bg-secondary/30 border-border focus:ring-primary"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {noticeText.length > 0
                          ? `${noticeText.length} chars`
                          : "No active notice"}
                      </span>
                      <Button
                        size="sm"
                        onClick={handleSaveNotice}
                        disabled={setAdminNotice.isPending}
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white"
                      >
                        {setAdminNotice.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : noticeSaved ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Megaphone className="w-3 h-3" />
                        )}
                        {noticeSaved ? "Saved!" : "Broadcast"}
                      </Button>
                    </div>
                    {noticeText && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1.5">
                          <Bell className="w-3 h-3" /> Preview:
                        </p>
                        <p className="text-xs text-amber-700">{noticeText}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Admin Info */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Admin Session
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Your Principal
                  </p>
                  <p className="text-xs font-mono text-foreground break-all">
                    {identity?.getPrincipal().toString() ?? "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Admin access verified
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Tracked Numbers */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                All Tracked Numbers
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {trackedNumbers?.length ?? 0} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {numbersLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : !trackedNumbers || trackedNumbers.length === 0 ? (
              <div className="py-12 text-center">
                <Phone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No tracked numbers yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Phone Number
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Nickname
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        User
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Date Added
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trackedNumbers.map((num) => (
                      <TableRow
                        key={num.id.toString()}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <TableCell className="text-xs font-semibold text-foreground py-3 font-mono">
                          {num.phoneNumber}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3">
                          {num.nickname || (
                            <span className="italic text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3 font-mono">
                          {truncatePrincipal(num.user)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3 font-mono">
                          {formatTimestamp(num.dateAdded)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 font-semibold border-0 ${
                              num.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : num.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {String(num.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-muted-foreground text-center">
            PhoneTrackr Admin · Auto-refreshes every 30s ·{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
