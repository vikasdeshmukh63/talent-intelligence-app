import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterDashboard from "@/components/landing/RecruiterDashboard";
import { apiClient } from "@/api/client";

export default function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const [recruiter, setRecruiter] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await apiClient.auth.me();
      setRecruiter(user);
    })();
  }, []);

  return (
    <RecruiterDashboard
      recruiterName={recruiter?.name || "Recruiter"}
      onLogout={() => {
        apiClient.auth.logout();
        navigate("/");
      }}
    />
  );
}
