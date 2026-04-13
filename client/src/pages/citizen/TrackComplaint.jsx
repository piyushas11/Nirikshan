import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Timeline from "../../components/ui/Timeline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";

const statusMeta = {
  PENDING: { label: "Pending", color: "yellow", icon: "⏳" },
  ASSIGNED: { label: "Assigned", color: "blue", icon: "👷" },
  IN_PROGRESS: { label: "In Progress", color: "purple", icon: "🔧" },
  RESOLVED: { label: "Resolved", color: "green", icon: "✅" },
  REJECTED: { label: "Rejected", color: "red", icon: "❌" },
};

export default function TrackComplaint() {
  const { complaint_id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approveModal, setApproveModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveNote, setApproveNote] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(
          `/complaint/${complaint_id}/detail`
        );
        setComplaint(res.data);
      } catch (err) {
        setError("Could not load complaint details.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [complaint_id]);

  const handleApprove = async (approved) => {
    setApproveLoading(true);
    try {
      await axiosInstance.post(`/complaint/${complaint_id}/approve`, {
        approved,
        note: approveNote,
      });
      setComplaint((prev) => ({
        ...prev,
        status: approved ? "RESOLVED" : "IN_PROGRESS",
        citizen_approved: approved,
      }));
      setApproveModal(false);
    } catch {
      // handle error
    } finally {
      setApproveLoading(false);
    }
  };

  const timelineEvents = complaint?.events?.map((ev) => ({
    label: ev.event_type?.replace(/_/g, " "),
    icon: "📌",
    timestamp: ev.timestamp,
    description: ev.metadata?.note || "",
    completed: true,
  })) ?? [];

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );

  const meta = statusMeta[complaint?.status] || {
    label: complaint?.status,
    color: "gray",
    icon: "📌",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Track Complaint</h1>
        <p className="text-gray-500 text-sm mt-1">
          Complaint #{complaint_id?.slice(0, 8)}...
        </p>
      </div>

      {/* Complaint Info */}
      <Card>
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Complaint Details</h2>
          <Badge color={meta.color}>
            {meta.icon} {meta.label}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-500">
            Description:{" "}
            <span className="text-gray-800 font-medium">
              {complaint?.description || "No description provided"}
            </span>
          </p>
          <p className="text-gray-500">
            Filed:{" "}
            <span className="text-gray-700">
              {new Date(complaint?.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
          {complaint?.batch_id && (
            <p className="text-gray-500">
              Linked Batch:{" "}
              <span className="font-mono text-gray-700 text-xs">
                {complaint.batch_id}
              </span>
            </p>
          )}
          {complaint?.assigned_worker && (
            <p className="text-gray-500">
              Assigned Worker:{" "}
              <span className="text-gray-700 font-medium">
                {complaint.assigned_worker}
              </span>
            </p>
          )}
        </div>

        {complaint?.photo_url && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">Complaint Photo</p>
            <img
              src={complaint.photo_url}
              alt="Complaint"
              className="w-full max-h-48 object-cover rounded-lg"
            />
          </div>
        )}
      </Card>

      {/* Clearance Photo (if resolved) */}
      {complaint?.clearance_photo_url && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            ✅ Clearance Photo (by Worker)
          </p>
          <img
            src={complaint.clearance_photo_url}
            alt="Clearance"
            className="w-full max-h-48 object-cover rounded-lg"
          />
        </Card>
      )}

      {/* Citizen Approval CTA */}
      {complaint?.status === "IN_PROGRESS" &&
        complaint?.clearance_photo_url &&
        !complaint?.citizen_approved && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-indigo-800 mb-1">
              Action Required
            </p>
            <p className="text-sm text-indigo-700 mb-3">
              The worker has uploaded a clearance photo. Please verify and
              approve or reject the resolution.
            </p>
            <button
              onClick={() => setApproveModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Review Resolution
            </button>
          </div>
        )}

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Event Timeline
        </h2>
        {timelineEvents.length > 0 ? (
          <Timeline events={timelineEvents} />
        ) : (
          <Card>
            <p className="text-center text-gray-400 py-6 text-sm">
              No timeline events yet.
            </p>
          </Card>
        )}
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModal}
        onClose={() => setApproveModal(false)}
        title="Review Resolution"
      >
        <div className="space-y-4 p-2">
          {complaint?.clearance_photo_url && (
            <img
              src={complaint.clearance_photo_url}
              alt="Clearance"
              className="w-full max-h-40 object-cover rounded-lg"
            />
          )}
          <p className="text-sm text-gray-600">
            Is the issue resolved to your satisfaction?
          </p>
          <textarea
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(true)}
              disabled={approveLoading}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              ✅ Approve
            </button>
            <button
              onClick={() => handleApprove(false)}
              disabled={approveLoading}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
            >
              ❌ Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}