// client/src/components/shared/NotificationBell.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRealtime } from "../../hooks/useRealtime";
import axiosInstance from "../../lib/axios";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?.id) return;
    axiosInstance
      .get("/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});
  }, [user?.id]);

  useRealtime(
    "notifications",
    `user_id=eq.${user?.id}`,
    (payload) => {
      if (payload.eventType === "INSERT") {
        setNotifications((prev) => [payload.new, ...prev]);
      }
    }
  );

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const typeIcon = {
    BATCH_UPDATE: "📦",
    COMPLAINT_UPDATE: "📋",
    ANOMALY: "⚠️",
    SYSTEM: "🔔",
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-800 text-sm">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No notifications yet
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition ${
                    !n.read ? "bg-indigo-50/60" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0">
                    {typeIcon[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}