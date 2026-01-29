"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { getTheme, setTheme, type ThemeMode } from "@/lib/theme";
import { formatDateTime } from "@/lib/date";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Event type options for filters
const USER_EVENT_TYPES = [
  "USER_CREATED",
  "USER_DEACTIVATED",
  "USER_REACTIVATED",
  "ROLE_CHANGED",
  "PASSWORD_CHANGED",
  "REQUEST_CREATED",
  "REQUEST_APPROVED",
  "REQUEST_DENIED",
];

const ASSET_EVENT_TYPES = [
  "CREATE",
  "ASSIGN",
  "RETURN",
  "UPDATE",
  "MOVE",
];

type CurrentUser = {
  id: number;
  role: string;
  email: string;
};

type AuditSummary = {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_assets: number;
  hardware_count: number;
  software_count: number;
  assigned_assets: number;
  in_stock_assets: number;
  retired_assets: number;
  software_seats_total: number;
  software_seats_used: number;
  software_seats_available: number;
  user_events_today: number;
  user_events_week: number;
  asset_events_today: number;
  asset_events_week: number;
};

type UserEvent = {
  id: number;
  event_type: string;
  timestamp: string;
  target_user_id: number | null;
  actor_user_id: number | null;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  target_user_name: string | null;
  actor_user_name: string | null;
};

type AssetEvent = {
  id: number;
  asset_id: number;
  asset_tag: string;
  event_type: string;
  from_user_id: number | null;
  to_user_id: number | null;
  from_location_id: number | null;
  to_location_id: number | null;
  actor_user_id: number | null;
  timestamp: string;
  notes: string | null;
  from_user_name: string | null;
  to_user_name: string | null;
  actor_user_name: string | null;
  from_location_name: string | null;
  to_location_name: string | null;
};

export default function AuditDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data state
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [assetEvents, setAssetEvents] = useState<AssetEvent[]>([]);

  // Tab state - initialize from URL param
  const initialTab = searchParams.get("tab");
  const defaultTab = initialTab === "users" ? "users" : initialTab === "assets" ? "assets" : "summary";
  const [activeTab, setActiveTab] = useState<"summary" | "users" | "assets">(defaultTab);
  const [refreshing, setRefreshing] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // Initialize theme state on mount
  useEffect(() => {
    setThemeMode(getTheme());
  }, []);

  // Filter state for user events
  const [userEventSearch, setUserEventSearch] = useState("");
  const [userEventTypeFilter, setUserEventTypeFilter] = useState("");
  const [loadingUserEvents, setLoadingUserEvents] = useState(false);
  const [hasMoreUserEvents, setHasMoreUserEvents] = useState(true);

  // Filter state for asset events
  const [assetEventSearch, setAssetEventSearch] = useState("");
  const [assetEventTypeFilter, setAssetEventTypeFilter] = useState("");
  const [loadingAssetEvents, setLoadingAssetEvents] = useState(false);
  const [hasMoreAssetEvents, setHasMoreAssetEvents] = useState(true);

  // Pagination constants
  const PAGE_SIZE = 100;

  // Debounce timer refs
  const userSearchDebounce = useRef<NodeJS.Timeout | null>(null);
  const assetSearchDebounce = useRef<NodeJS.Timeout | null>(null);

  // Load user events with filters (reset mode - replaces existing)
  const loadUserEvents = useCallback(async (search?: string, eventType?: string) => {
    try {
      setLoadingUserEvents(true);
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", "0");
      if (search) params.set("search", search);
      if (eventType) params.set("event_type", eventType);

      const data = await apiFetch<UserEvent[]>(`/audit/user-events?${params}`, {}, token);
      setUserEvents(data);
      setHasMoreUserEvents(data.length === PAGE_SIZE);
    } catch {
      // Silently fail - main loadData will handle auth errors
    } finally {
      setLoadingUserEvents(false);
    }
  }, []);

  // Load more user events (append mode)
  const loadMoreUserEvents = useCallback(async () => {
    try {
      setLoadingUserEvents(true);
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(userEvents.length));
      if (userEventSearch) params.set("search", userEventSearch);
      if (userEventTypeFilter) params.set("event_type", userEventTypeFilter);

      const data = await apiFetch<UserEvent[]>(`/audit/user-events?${params}`, {}, token);
      setUserEvents((prev) => [...prev, ...data]);
      setHasMoreUserEvents(data.length === PAGE_SIZE);
    } catch {
      // Silently fail
    } finally {
      setLoadingUserEvents(false);
    }
  }, [userEvents.length, userEventSearch, userEventTypeFilter]);

  // Load asset events with filters (reset mode - replaces existing)
  const loadAssetEvents = useCallback(async (search?: string, eventType?: string) => {
    try {
      setLoadingAssetEvents(true);
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", "0");
      if (search) params.set("search", search);
      if (eventType) params.set("event_type", eventType);

      const data = await apiFetch<AssetEvent[]>(`/audit/asset-events?${params}`, {}, token);
      setAssetEvents(data);
      setHasMoreAssetEvents(data.length === PAGE_SIZE);
    } catch {
      // Silently fail
    } finally {
      setLoadingAssetEvents(false);
    }
  }, []);

  // Load more asset events (append mode)
  const loadMoreAssetEvents = useCallback(async () => {
    try {
      setLoadingAssetEvents(true);
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(assetEvents.length));
      if (assetEventSearch) params.set("search", assetEventSearch);
      if (assetEventTypeFilter) params.set("event_type", assetEventTypeFilter);

      const data = await apiFetch<AssetEvent[]>(`/audit/asset-events?${params}`, {}, token);
      setAssetEvents((prev) => [...prev, ...data]);
      setHasMoreAssetEvents(data.length === PAGE_SIZE);
    } catch {
      // Silently fail
    } finally {
      setLoadingAssetEvents(false);
    }
  }, [assetEvents.length, assetEventSearch, assetEventTypeFilter]);

  // Debounced search handlers
  const handleUserSearchChange = (value: string) => {
    setUserEventSearch(value);
    if (userSearchDebounce.current) clearTimeout(userSearchDebounce.current);
    userSearchDebounce.current = setTimeout(() => {
      loadUserEvents(value, userEventTypeFilter);
    }, 300);
  };

  const handleAssetSearchChange = (value: string) => {
    setAssetEventSearch(value);
    if (assetSearchDebounce.current) clearTimeout(assetSearchDebounce.current);
    assetSearchDebounce.current = setTimeout(() => {
      loadAssetEvents(value, assetEventTypeFilter);
    }, 300);
  };

  // Filter type change handlers (immediate)
  const handleUserEventTypeChange = (value: string) => {
    setUserEventTypeFilter(value);
    loadUserEvents(userEventSearch, value);
  };

  const handleAssetEventTypeChange = (value: string) => {
    setAssetEventTypeFilter(value);
    loadAssetEvents(assetEventSearch, value);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Load current user first to check permissions
      const meData = await apiFetch<CurrentUser>("/auth/me", {}, token);
      setCurrentUser(meData);

      // Only admin and auditor can access
      if (meData.role !== "ADMIN" && meData.role !== "AUDITOR") {
        router.push("/assets");
        return;
      }

      // Load all audit data in parallel
      const [summaryData, userEventsData, assetEventsData] = await Promise.all([
        apiFetch<AuditSummary>("/audit/summary", {}, token),
        apiFetch<UserEvent[]>(`/audit/user-events?limit=${PAGE_SIZE}`, {}, token),
        apiFetch<AssetEvent[]>(`/audit/asset-events?limit=${PAGE_SIZE}`, {}, token),
      ]);

      setSummary(summaryData);
      setUserEvents(userEventsData);
      setAssetEvents(assetEventsData);
      // Set hasMore based on whether we got a full page of results
      setHasMoreUserEvents(userEventsData.length === PAGE_SIZE);
      setHasMoreAssetEvents(assetEventsData.length === PAGE_SIZE);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }


  function getUserEventBadgeColor(eventType: string) {
    switch (eventType) {
      case "USER_CREATED": return "bg-green-100 text-green-800";
      case "USER_DEACTIVATED": return "bg-red-100 text-red-800";
      case "USER_REACTIVATED": return "bg-blue-100 text-blue-800";
      case "ROLE_CHANGED": return "bg-purple-100 text-purple-800";
      case "REQUEST_CREATED": return "bg-yellow-100 text-yellow-800";
      case "REQUEST_APPROVED": return "bg-emerald-100 text-emerald-800";
      case "REQUEST_DENIED": return "bg-orange-100 text-orange-800";
      case "PASSWORD_CHANGED": return "bg-slate-100 text-slate-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getAssetEventBadgeColor(eventType: string) {
    switch (eventType) {
      case "CREATE": return "bg-green-100 text-green-800";
      case "ASSIGN": return "bg-blue-100 text-blue-800";
      case "RETURN": return "bg-amber-100 text-amber-800";
      case "MOVE": return "bg-purple-100 text-purple-800";
      case "UPDATE": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  // CSV Export helpers
  function escapeCSV(value: string | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function downloadCSV(filename: string, csvContent: string) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportUserEventsCSV() {
    const headers = ["Timestamp", "Event Type", "Target User", "Actor", "Old Value", "New Value", "Notes"];
    const rows = userEvents.map((e) => [
      formatDateTime(e.timestamp),
      e.event_type,
      e.target_user_name || "",
      e.actor_user_name || "",
      e.old_value || "",
      e.new_value || "",
      e.notes || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`user-events-${date}.csv`, csv);
  }

  function exportAssetEventsCSV() {
    const headers = ["Timestamp", "Asset Tag", "Event Type", "From User", "To User", "From Location", "To Location", "Actor", "Notes"];
    const rows = assetEvents.map((e) => [
      formatDateTime(e.timestamp),
      e.asset_tag,
      e.event_type,
      e.from_user_name || "",
      e.to_user_name || "",
      e.from_location_name || "",
      e.to_location_name || "",
      e.actor_user_name || "",
      e.notes || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`asset-events-${date}.csv`, csv);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-12 h-12" />
          <p className="text-slate-600 dark:text-[#96989d]">Loading audit dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#2a2a2a] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/assets" className="flex items-center gap-3 group">
                <img 
                  src="/logo.png" 
                  alt="ASTRA" 
                  className="w-14 h-14 object-contain transition-transform group-hover:scale-105"
                />
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-[#f0f6fc]">ASTRA</h1>
                  <p className="text-sm text-slate-500 dark:text-[#96989d]">Audit Dashboard</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hover-lift"
                title="Refresh"
              >
                <svg className={`w-4 h-4 ${refreshing ? "animate-spin-reverse" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>

              <Link href="/assets">
                <Button variant="outline" className="hover-lift">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Assets
                </Button>
              </Link>

              <Link href="/users">
                <Button variant="outline" className="hover-lift">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Users
                </Button>
              </Link>

              <Button
                variant="ghost"
                onClick={() => {
                  const next: ThemeMode = themeMode === "light" ? "dark" : "light";
                  setTheme(next);
                  setThemeMode(next);
                }}
                className="text-slate-600 hover:text-slate-800 dark:text-[#96989d] dark:hover:text-[#dcddde] transition-colors"
                title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {themeMode === "dark" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  clearToken();
                  window.location.href = "/login";
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Users Card */}
            <Card className="shadow-lg border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#000000] backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-[#96989d]">Total Users</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-[#f0f6fc]">{summary.total_users}</p>
                    <p className="text-xs text-slate-400 dark:text-[#6e7681]">
                      <span className="text-green-600 dark:text-green-400">{summary.active_users} active</span>
                      {summary.inactive_users > 0 && (
                        <span className="text-red-500 dark:text-red-400 ml-2">{summary.inactive_users} inactive</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assets Card */}
            <Card className="shadow-lg border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#000000] backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-[#96989d]">Total Assets</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-[#f0f6fc]">{summary.total_assets}</p>
                    <p className="text-xs text-slate-400 dark:text-[#6e7681]">
                      <span className="text-blue-600 dark:text-blue-400">{summary.hardware_count} HW</span>
                      <span className="text-purple-600 dark:text-purple-400 ml-2">{summary.software_count} SW</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Activity Card */}
            <Card className="shadow-lg border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#000000] backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-[#96989d]">User Events</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-[#f0f6fc]">{summary.user_events_week}</p>
                    <p className="text-xs text-slate-400 dark:text-[#6e7681]">
                      <span className="text-emerald-600 dark:text-emerald-400">{summary.user_events_today} today</span>
                      <span className="text-slate-400 dark:text-[#6e7681] ml-2">/ {summary.user_events_week} this week</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset Activity Card */}
            <Card className="shadow-lg border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#000000] backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-[#96989d]">Asset Events</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-[#f0f6fc]">{summary.asset_events_week}</p>
                    <p className="text-xs text-slate-400 dark:text-[#6e7681]">
                      <span className="text-amber-600 dark:text-amber-400">{summary.asset_events_today} today</span>
                      <span className="text-slate-400 dark:text-[#6e7681] ml-2">/ {summary.asset_events_week} this week</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Asset Status Breakdown */}
        {summary && (
          <Card className="shadow-lg border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#000000] backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 dark:border-[#2a2a2a] pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-[#f0f6fc] flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Asset Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-transparent dark:border-green-800/30">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.in_stock_assets}</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">In Stock</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-transparent dark:border-blue-800/30">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.assigned_assets}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Assigned</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent dark:border-slate-700/30">
                  <p className="text-3xl font-bold text-slate-600 dark:text-slate-300">{summary.retired_assets}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-400 mt-1">Retired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Activity Logs */}
        <Card className="shadow-xl border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#000000] backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 dark:border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-[#f0f6fc]">
                Activity Logs
              </CardTitle>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#1a1a1a] rounded-lg border dark:border-[#2a2a2a]">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === "users"
                      ? "bg-white dark:bg-[#5865f2] text-indigo-600 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-[#96989d] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#2a2a2a]"
                  }`}
                >
                  User Events ({userEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab("assets")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === "assets"
                      ? "bg-white dark:bg-[#5865f2] text-indigo-600 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-[#96989d] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#2a2a2a]"
                  }`}
                >
                  Asset Events ({assetEvents.length})
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === "users" && (
              <div>
                {/* Filters */}
                <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] flex flex-wrap gap-3 items-center">
                  <Input
                    type="text"
                    placeholder="Search by user or notes..."
                    value={userEventSearch}
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={userEventTypeFilter}
                    onChange={(e) => handleUserEventTypeChange(e.target.value)}
                    className="h-10 rounded-md border border-slate-300 dark:border-[#2a2a2a] bg-white dark:bg-[#000000] text-slate-800 dark:text-[#dcddde] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/30"
                  >
                    <option value="" className="bg-white dark:bg-[#0a0a0a]">All Event Types</option>
                    {USER_EVENT_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-white dark:bg-[#0a0a0a]">
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  {(userEventSearch || userEventTypeFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUserEventSearch("");
                        setUserEventTypeFilter("");
                        loadUserEvents("", "");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  {loadingUserEvents && (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-sm text-muted-foreground">
                      {userEvents.length} events
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportUserEventsCSV}
                      disabled={userEvents.length === 0}
                      className="gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </Button>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                {userEvents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No user events recorded yet.
                  </div>
                ) : userEvents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No events match your filters.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-44">Timestamp</TableHead>
                        <TableHead className="w-36">Event</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-32">Actor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userEvents.map((event) => (
                        <TableRow key={event.id} className="table-row-hover">
                          <TableCell className="text-sm text-slate-600 dark:text-[#dcddde]">
                            {formatDateTime(event.timestamp)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserEventBadgeColor(event.event_type)}`}>
                              {event.event_type.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800 dark:text-white">
                            {event.target_user_name || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              {event.old_value && event.new_value && (
                                <span className="text-slate-500 dark:text-[#96989d]">
                                  {event.old_value} → {event.new_value}
                                </span>
                              )}
                              {event.notes && (
                                <p className="text-slate-500 dark:text-[#96989d] text-xs mt-0.5 max-w-xs truncate" title={event.notes}>
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-[#dcddde]">
                            {event.actor_user_name || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {/* Load More Button */}
                {hasMoreUserEvents && userEvents.length > 0 && (
                  <div className="p-4 border-t border-slate-100 dark:border-[#2a2a2a] text-center">
                    <Button
                      variant="outline"
                      onClick={loadMoreUserEvents}
                      disabled={loadingUserEvents}
                    >
                      {loadingUserEvents ? "Loading..." : `Load More (showing ${userEvents.length})`}
                    </Button>
                  </div>
                )}
              </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div>
                {/* Filters */}
                <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] flex flex-wrap gap-3 items-center">
                  <Input
                    type="text"
                    placeholder="Search by asset, user, or notes..."
                    value={assetEventSearch}
                    onChange={(e) => handleAssetSearchChange(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={assetEventTypeFilter}
                    onChange={(e) => handleAssetEventTypeChange(e.target.value)}
                    className="h-10 rounded-md border border-slate-300 dark:border-[#2a2a2a] bg-white dark:bg-[#000000] text-slate-800 dark:text-[#dcddde] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/30"
                  >
                    <option value="" className="bg-white dark:bg-[#0a0a0a]">All Event Types</option>
                    {ASSET_EVENT_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-white dark:bg-[#0a0a0a]">
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  {(assetEventSearch || assetEventTypeFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAssetEventSearch("");
                        setAssetEventTypeFilter("");
                        loadAssetEvents("", "");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  {loadingAssetEvents && (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-sm text-muted-foreground">
                      {assetEvents.length} events
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAssetEventsCSV}
                      disabled={assetEvents.length === 0}
                      className="gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </Button>
                  </div>
                </div>
              <div className="max-h-[500px] overflow-y-auto">
                {assetEvents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No asset events recorded yet.
                  </div>
                ) : assetEvents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No events match your filters.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-44">Timestamp</TableHead>
                        <TableHead className="w-28">Asset</TableHead>
                        <TableHead className="w-32">Event</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-32">Actor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetEvents.map((event) => (
                        <TableRow key={event.id} className="table-row-hover">
                          <TableCell className="text-sm text-slate-600 dark:text-[#dcddde]">
                            {formatDateTime(event.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/assets/${event.asset_id}`}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-[#5865f2] dark:hover:text-[#7983f5] font-medium"
                            >
                              {event.asset_tag}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAssetEventBadgeColor(event.event_type)}`}>
                              {event.event_type.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col gap-0.5">
                              {/* User info for ASSIGN/RETURN events */}
                              {event.from_user_name && (
                                <span className="text-slate-500 dark:text-[#96989d]">
                                  From: <span className="font-medium text-slate-700 dark:text-white">{event.from_user_name}</span>
                                </span>
                              )}
                              {event.to_user_name && (
                                <span className="text-slate-500 dark:text-[#96989d]">
                                  To: <span className="font-medium text-slate-700 dark:text-white">{event.to_user_name}</span>
                                </span>
                              )}
                              {/* Location info for MOVE events */}
                              {event.event_type === "MOVE" && (
                                <span className="text-purple-600 dark:text-purple-400">
                                  {event.from_location_name || "(none)"} → {event.to_location_name || "(none)"}
                                </span>
                              )}
                              {event.notes && event.event_type !== "MOVE" && (
                                <p className="text-slate-400 dark:text-[#96989d] text-xs truncate max-w-xs" title={event.notes}>
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-[#dcddde]">
                            {event.actor_user_name || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {/* Load More Button */}
                {hasMoreAssetEvents && assetEvents.length > 0 && (
                  <div className="p-4 border-t border-slate-100 dark:border-[#2a2a2a] text-center">
                    <Button
                      variant="outline"
                      onClick={loadMoreAssetEvents}
                      disabled={loadingAssetEvents}
                    >
                      {loadingAssetEvents ? "Loading..." : `Load More (showing ${assetEvents.length})`}
                    </Button>
                  </div>
                )}
              </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
