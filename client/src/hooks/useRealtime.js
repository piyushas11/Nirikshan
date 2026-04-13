import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * useRealtime(table, filter, callback)
 *
 * Subscribes to Supabase Realtime changes on a table with an optional filter.
 *
 * @param {string}   table     Supabase table name e.g. "batches"
 * @param {string}   filter    PostgREST filter string e.g. "citizen_id=eq.some-uuid"
 * @param {Function} callback  Called with the Supabase payload on INSERT/UPDATE/DELETE
 *
 * Usage:
 *   useRealtime("batches", `citizen_id=eq.${user.id}`, (payload) => {
 *     if (payload.eventType === "UPDATE") setBatch(payload.new);
 *   });
 */
export const useRealtime = (table, filter, callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!table) return;

    const channelName = `realtime:${table}:${filter || "all"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: filter || undefined,
        },
        (payload) => {
          callbackRef.current(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
};