import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiClient } from "@/api/client";

export function RequireAuth({ children, allowRoles = [] }) {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await apiClient.auth.me();
        if (mounted) setState({ loading: false, user });
      } catch {
        apiClient.auth.logout();
        if (mounted) setState({ loading: false, user: null });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return <div className="p-6 text-sm">Checking session...</div>;
  if (!state.user) return <Navigate to="/auth/candidate" replace />;
  if (allowRoles.length > 0 && !allowRoles.includes(state.user.role)) return <Navigate to="/" replace />;
  return children;
}

export function RedirectIfAuth({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await apiClient.auth.me();
        if (mounted) setState({ loading: false, user });
      } catch {
        if (mounted) setState({ loading: false, user: null });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return <div className="p-6 text-sm">Loading...</div>;
  if (state.user) {
    const map = {
      candidate: "/dashboard/candidate",
      recruiter: "/dashboard/recruiter",
      interviewer: "/dashboard/interviewer",
      admin: "/dashboard/admin",
      ceo_chro: "/dashboard/ceo-chro",
    };
    return <Navigate to={map[state.user.role] || "/"} replace />;
  }
  return children;
}
