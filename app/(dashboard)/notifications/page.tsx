"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, AppNotification } from "@/context/notification-context";
import { useDashboard } from "@/context/dashboard-context";

// ─── Type filter tabs ────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "new_message", label: "Messages" },
  { key: "vendor_message", label: "Vendors" },
  { key: "group_message", label: "Groups" },
  { key: "info", label: "Info" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

// ─── Icon map ─────────────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "new_message") {
    return (
      <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    );
  }
  if (type === "vendor_message") {
    return (
      <div className="h-10 w-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 shadow-sm">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
    );
  }
  if (type === "group_message") {
    return (
      <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="h-10 w-10 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-sm">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotificationRow({
  notif,
  onRead,
  onClear,
  onNavigate,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onClear: (id: string) => void;
  onNavigate: (chatId?: string) => void;
}) {
  return (
    <div
      className={`group relative flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
        notif.isRead
          ? "bg-white dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
          : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-950/30"
      }`}
      onClick={() => {
        onRead(notif.id);
        onNavigate(notif.chatId);
      }}
    >
      {/* Unread indicator bar */}
      {!notif.isRead && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary" />
      )}

      <NotifIcon type={notif.type} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${notif.isRead ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-900 dark:text-zinc-50"}`}>
              {notif.title}
            </p>
            {notif.type === "group_message" && notif.senderName && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {notif.senderName}
              </span>
            )}
            <p className={`text-xs mt-1 leading-relaxed ${notif.isRead ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-300"}`}>
              {notif.body}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">{notif.timestamp}</span>
            {!notif.isRead && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Clear button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClear(notif.id);
        }}
        className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
        title="Remove notification"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, markRead, clearNotification, clearAll } =
    useNotifications();
  const { setActiveChatId } = useDashboard();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadFiltered = filtered.filter((n) => !n.isRead).length;

  const handleNavigate = (chatId?: string) => {
    if (chatId) {
      setActiveChatId(chatId);
      router.push("/chat");
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Bell icon badge */}
          <div className="relative h-10 w-10 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-secondary shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-white text-[9px] font-extrabold px-1 shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {notifications.length === 0
                ? "No notifications yet"
                : `${notifications.length} total · ${unreadCount} unread`}
            </p>
          </div>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary dark:text-secondary text-xs font-bold transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-zinc-100/80 dark:bg-zinc-800/50 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? notifications.length
              : notifications.filter((n) => n.type === tab.key).length;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-secondary"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Unread section label ──────────────────────────────── */}
      {unreadFiltered > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-extrabold text-primary dark:text-secondary uppercase tracking-widest">
            Unread
          </span>
          <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
          <span className="text-[10px] font-bold text-zinc-400">{unreadFiltered} new</span>
        </div>
      )}

      {/* ── Notifications list ────────────────────────────────── */}
      {filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-inner">
            <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">All caught up!</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {activeFilter === "all"
                ? "No notifications yet."
                : `No ${activeFilter.replace("_", " ")} notifications.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Unread first */}
          {filtered
            .filter((n) => !n.isRead)
            .map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onClear={clearNotification}
                onNavigate={handleNavigate}
              />
            ))}

          {/* Read section divider */}
          {filtered.some((n) => !n.isRead) && filtered.some((n) => n.isRead) && (
            <div className="flex items-center gap-2 my-2">
              <span className="text-[11px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Earlier
              </span>
              <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
            </div>
          )}

          {/* Read */}
          {filtered
            .filter((n) => n.isRead)
            .map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onClear={clearNotification}
                onNavigate={handleNavigate}
              />
            ))}
        </div>
      )}
    </div>
  );
}
