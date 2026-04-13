// client/src/pages/citizen/ApproveResolution.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../lib/axios";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Timeline from "../../components/ui/Timeline";

export default function ApproveResolution() {
  const { complaint_id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [confirmModal, setConfirmModal] = useState(null); // "approve" | "reject"
  const [done, setDone] = useState(null); // "approved" | "rejected"

  useEffect(() => {
    fetchDetail();
  }, [complaint_id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      const res = await axios.get(`/complaint/${complaint_id}/detail`);
      setComplaint(res.data.complaint);
      setTimeline(res.data.timeline || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(approved) {
    setConfirmModal(null);
    setSubmitting(true);
    try {
      await axios.post(`/complaint/${complaint_id}/approve`, { approved, feedback });
      setDone(approved ? "approved" : "rejected");
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card className="bg-red-50 border border-red-200 p-4 text-red-700">{error}</Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto p-4 flex flex-col items-center gap-4 mt-12">
        <div className={`text-5xl ${done === "approved" ? "text-green-500" : "text-yellow-500"}`}>
          {done === "approved" ? "✅" : "🔁"}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          {done === "approved" ? "Resolution Approved" : "Complaint Re-opened"}
        </h2>
        <p className="text-gray-500 text-center">
          {done === "approved"
            ? "Thanks for confirming. Your complaint is now closed."
            : "We've flagged this for further review. A worker will follow up."}
        </p>
        <button
          onClick={() => navigate("/citizen")}
          className="mt-2 bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const STATUS_COLORS = {
    OPEN: "yellow",
    ASSIGNED: "blue",
    RESOLVED: "purple",
    CLOSED: "green",
    REOPEN: "red",
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Resolution</h1>
        <p className="text-gray-500 text-sm mt-1">
          A worker has marked your complaint as resolved. Please review and respond.
        </p>
      </div>

      {/* Complaint summary */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Complaint Details</h2>
          <Badge color={STATUS_COLORS[complaint.status] || "gray"}>{complaint.status}</Badge>
        </div>

        <p className="text-gray-700">{complaint.description}</p>

        {complaint.photo_url && (
          <img
            src={complaint.photo_url}
            alt="Complaint photo"
            className="w-full max-h-56 object-cover rounded-xl border border-gray-100"
          />
        )}

        {complaint.clearance_photo_url && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-600 mb-1">Worker Clearance Photo</p>
            <img
              src={complaint.clearance_photo_url}
              alt="Clearance photo"
              className="w-full max-h-56 object-cover rounded-xl border border-green-100"
            />
          </div>
        )}

        {complaint.resolution_notes && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm text-green-800 font-medium">Worker Notes</p>
            <p className="text-sm text-green-700 mt-1">{complaint.resolution_notes}</p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Submitted {new Date(complaint.created_at).toLocaleString()}
        </p>
      </Card>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Status Timeline</h2>
          <Timeline
            steps={timeline.map((ev) => ({
              id: ev.id,
              label: ev.event_type.replace(/_/g, " "),
              timestamp: ev.created_at,
              done: true,
            }))}
          />
        </Card>
      )}

      {/* Only show action if status is RESOLVED */}
      {complaint.status === "RESOLVED" && (
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold text-gray-800">Your Feedback (optional)</h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add any comments about the resolution..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal("approve")}
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              ✅ Approve Resolution
            </button>
            <button
              onClick={() => setConfirmModal("reject")}
              disabled={submitting}
              className="flex-1 bg-red-100 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-200 transition disabled:opacity-50"
            >
              ❌ Reject &amp; Re-open
            </button>
          </div>
        </Card>
      )}

      {complaint.status !== "RESOLVED" && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          This complaint is currently <strong>{complaint.status}</strong> and not yet awaiting your review.
        </Card>
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <Modal onClose={() => setConfirmModal(null)}>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {confirmModal === "approve" ? "Approve this resolution?" : "Re-open this complaint?"}
            </h3>
            <p className="text-sm text-gray-600">
              {confirmModal === "approve"
                ? "This will close the complaint permanently."
                : "The complaint will be sent back for re-investigation."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(confirmModal === "approve")}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                  confirmModal === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {submitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}