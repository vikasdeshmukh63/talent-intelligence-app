// Shared in-memory store for candidate leads submitted via resume upload.
// Starts empty; real recruiter/admin leads are fetched from backend APIs.

let _leads = [];
let _listeners = [];

export const leadStore = {
  getLeads: () => _leads,

  addLead: (lead) => {
    const exists = _leads.find(l => l.email === lead.email);
    if (!exists) {
      _leads = [{ ...lead, id: Date.now(), submittedAt: new Date().toLocaleString("en-IN"), status: "pending", resumeUrl: lead.resumeUrl }, ..._leads];
      leadStore._notify();
    }
  },

  updateStatus: (id, status) => {
    _leads = _leads.map(l => l.id === id ? { ...l, status } : l);
    leadStore._notify();
  },

  subscribe: (fn) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },

  _notify: () => {
    _listeners.forEach(fn => fn());
  },
};