// server/services/notification.service.js
import { supabase } from "../config/supabase.js";

/**
 * Insert a notification row that Supabase Realtime will broadcast
 * to the relevant citizen's subscription channel.
 *
 * The frontend useRealtime.js hook subscribes to:
 *   table: "notifications", filter: `recipient_id=eq.${userId}`
 */

async function insertNotification({ recipient_id, type, title, body, metadata = {} }) {
  const { error } = await supabase.from("notifications").insert({
    recipient_id,
    type,
    title,
    body,
    metadata,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("insertNotification failed (non-fatal):", error.message);
  }
}

/**
 * Notify a citizen when their batch status changes.
 */
export async function notifyBatchUpdate(citizen_id, batch_id, new_status) {
  const STATUS_MESSAGES = {
    PICKED_UP:  "Your waste batch has been picked up by a worker.",
    CENTER:     "Your batch has arrived at the processing center.",
    SEGREGATED: "Your batch waste has been successfully segregated.",
    PROCESSED:  "Your batch has been fully processed. Thank you!",
  };

  await insertNotification({
    recipient_id: citizen_id,
    type: "BATCH_UPDATE",
    title: `Batch status: ${new_status.replace("_", " ")}`,
    body: STATUS_MESSAGES[new_status] || `Batch ${batch_id} status updated to ${new_status}.`,
    metadata: { batch_id, new_status },
  });
}

/**
 * Notify relevant parties when a complaint status changes.
 */
export async function notifyComplaintUpdate(complaint_id, new_status) {
  try {
    const { data: complaint } = await supabase
      .from("complaints")
      .select("citizen_id, assigned_worker_id")
      .eq("id", complaint_id)
      .single();

    if (!complaint) return;

    const STATUS_MESSAGES = {
      ASSIGNED: "Your complaint has been assigned to a worker.",
      RESOLVED: "Your complaint has been marked as resolved. Please review and approve.",
      CLOSED:   "Your complaint has been closed. Thank you for your feedback.",
      REOPEN:   "Your complaint has been re-opened for further review.",
    };

    // Notify citizen
    if (complaint.citizen_id) {
      await insertNotification({
        recipient_id: complaint.citizen_id,
        type: "COMPLAINT_UPDATE",
        title: `Complaint ${new_status.toLowerCase()}`,
        body: STATUS_MESSAGES[new_status] || `Complaint status updated to ${new_status}.`,
        metadata: { complaint_id, new_status },
      });
    }

    // Notify assigned worker when re-opened
    if (new_status === "REOPEN" && complaint.assigned_worker_id) {
      await insertNotification({
        recipient_id: complaint.assigned_worker_id,
        type: "COMPLAINT_REOPEN",
        title: "Complaint re-opened by citizen",
        body: "A citizen has rejected your resolution. Please review.",
        metadata: { complaint_id },
      });
    }
  } catch (err) {
    console.warn("notifyComplaintUpdate failed (non-fatal):", err.message);
  }
}