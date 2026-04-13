import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Timeline from "../../components/ui/Timeline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const STATUS_ORDER = ["CREATED", "PICKED_UP", "AT_CENTER", "SEGREGATED", "PROCESSED"];

const statusMeta = {
  CREATED: { label: "Created", icon: "📦", color: "blue" },
  PICKED_UP: { label: "Picked Up", icon: "🚛", color: "yellow" },
  AT_CENTER: { label: "At Center", icon: "🏭", color: "purple" },
  SEGREGATED: { label: "Segregated", icon: "♻️", color: "orange" },
  PROCESSED: { label: "Processed", icon: "✅", color: "green" },
};

export default function TrackBatch() {
  const { batch_id } = useParams();
  const navigate = useNavigate();

  const [batchIdInput, setBatchIdInput] = useState(batch_id || "");
  const [batch, setBatch] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(!!batch_id);
  const [error, setError] = useState("");

  useEffect(() => {
    if (batch_id) {
      fetchBatch(batch_id);
    }
  }, [batch_id]);

  const fetchBatch = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/batch/${id}/timeline`);
      setBatch(res.data.batch);
      setTimeline(res.data.events);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Batch not found. Please check the ID."
          : "Failed to load batch details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!batchIdInput.trim()) return;
    navigate(`/citizen/track-batch/${batchIdInput.trim()}`);
    fetchBatch(batchIdInput.trim());
  };

  const currentStatusIndex = batch
    ? STATUS_ORDER.indexOf(batch.status)
    : -1;

  const timelineEvents = timeline.map((ev) => ({
    label: statusMeta[ev.event_type]?.label || ev.event_type,
    icon: statusMeta[ev.event_type]?.icon || "📌",
    timestamp: ev.timestamp,
    description: ev.metadata?.note || "",
    completed: true,
  }));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Track Batch</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter a batch ID or scan a QR code to track your waste
        </p>
      </div>

      {/* Search */}
      <Card>
        <div className="flex gap-2">
          <input
            value={batchIdInput}
            onChange={(e) => setBatchIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter Batch ID..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Track
          </button>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {batch && !loading && (
        <>
          {/* Batch Info */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Batch Details</h2>
              <Badge color={statusMeta[batch.status]?.color || "gray"}>
                {statusMeta[batch.status]?.label || batch.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Batch ID</p>
                <p className="font-mono text-gray-700 text-xs">{batch.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Waste Type</p>
                <p className="font-medium text-gray-700">{batch.waste_type}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Created</p>
                <p className="text-gray-700">
                  {new Date(batch.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {batch.gps_lat && (
                <div>
                  <p className="text-gray-400 text-xs">Location</p>
                  <p className="text-gray-700">
                    {Number(batch.gps_lat).toFixed(4)},{" "}
                    {Number(batch.gps_lng).toFixed(4)}
                  </p>
                </div>
              )}
            </div>
            {batch.photo_url && (
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-1">Waste Photo</p>
                <img
                  src={batch.photo_url}
                  alt="Waste"
                  className="w-full max-h-40 object-cover rounded-lg"
                />
              </div>
            )}
          </Card>

          {/* Progress Bar */}
          <Card>
            <p className="text-sm font-semibold text-gray-700 mb-4">
              Lifecycle Progress
            </p>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 z-0">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{
                    width: `${
                      currentStatusIndex >= 0
                        ? (currentStatusIndex / (STATUS_ORDER.length - 1)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              {STATUS_ORDER.map((status, idx) => {
                const meta = statusMeta[status];
                const done = idx <= currentStatusIndex;
                return (
                  <div
                    key={status}
                    className="flex flex-col items-center z-10 gap-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition ${
                        done
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "bg-white border-gray-300 text-gray-300"
                      }`}
                    >
                      {meta.icon}
                    </div>
                    <p
                      className={`text-xs text-center max-w-[56px] {
                        done ? "text-indigo-600 font-medium" : "text-gray-400"
                      }`}
                    >
                      {meta.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

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
                  No events recorded yet.
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}