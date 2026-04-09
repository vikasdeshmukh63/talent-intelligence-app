import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import { apiClient } from "@/api/client";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  return <AdminDashboard onLogout={() => { apiClient.auth.logout(); navigate("/"); }} />;
}
