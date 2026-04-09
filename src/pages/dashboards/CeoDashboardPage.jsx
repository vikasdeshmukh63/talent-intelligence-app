import React from "react";
import { useNavigate } from "react-router-dom";
import CeoDashboard from "@/components/dashboards/CeoDashboard";
import { apiClient } from "@/api/client";

export default function CeoDashboardPage() {
  const navigate = useNavigate();
  return <CeoDashboard position="CEO" onLogout={() => { apiClient.auth.logout(); navigate("/"); }} />;
}
