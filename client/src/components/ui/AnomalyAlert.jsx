import React from "react";

const AnomalyAlert = ({ title, description, severity = "medium" }) => {
  const colors = {
    low: "border-yellow-500",
    medium: "border-orange-500",
    high: "border-red-500",
  };

  return (
    <div className={`bg-gray-900 p-4 rounded-xl border-l-4 ${colors[severity]}`}>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default AnomalyAlert;