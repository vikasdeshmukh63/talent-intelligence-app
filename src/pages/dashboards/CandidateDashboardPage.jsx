import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateDashboard from "@/components/dashboards/CandidateDashboard";
import { apiClient } from "@/api/client";

export default function CandidateDashboardPage() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await apiClient.auth.me();
      setCandidate({
        name: user?.name || "Candidate",
        email: user?.email || "",
        phone: user?.phone || "",
        location: user?.location || "",
      });
    })();
  }, []);

  if (!candidate) return <div className="p-6">Loading...</div>;
  return (
    <CandidateDashboard
      candidate={candidate}
      onProfileUpdate={(updatedUser) =>
        setCandidate({
          name: updatedUser?.name || "Candidate",
          email: updatedUser?.email || "",
          phone: updatedUser?.phone || "",
          location: updatedUser?.location || "",
        })
      }
      onLogout={() => {
        apiClient.auth.logout();
        navigate("/");
      }}
    />
  );
}
