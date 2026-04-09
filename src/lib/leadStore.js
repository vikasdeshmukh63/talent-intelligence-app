// Shared in-memory store for candidate leads submitted via resume upload

let _leads = [
  {
    id: 1,
    name: "Rohit Sharma",
    email: "rohit.sharma@gmail.com",
    phone: "+91-9876543210",
    location: "Bangalore, India",
    topMatch: "Senior React Developer",
    aiScore: 87,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
    status: "accepted",
    resumeUrl: "https://example.com/resume1.pdf",
  },
  {
    id: 2,
    name: "Priya Patel",
    email: "priya.patel@gmail.com",
    phone: "+91-9876543211",
    location: "Mumbai, India",
    topMatch: "Product Manager",
    aiScore: 82,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
    status: "pending",
    resumeUrl: "https://example.com/resume2.pdf",
  },
  {
    id: 3,
    name: "Arjun Kapoor",
    email: "arjun.kapoor@gmail.com",
    phone: "+91-9876543212",
    location: "Delhi, India",
    topMatch: "Data Scientist",
    aiScore: 91,
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
    status: "accepted",
    resumeUrl: "https://example.com/resume3.pdf",
  },
  {
    id: 4,
    name: "Sneha Desai",
    email: "sneha.desai@gmail.com",
    phone: "+91-9876543213",
    location: "Pune, India",
    topMatch: "Full Stack Developer",
    aiScore: 79,
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
    status: "rejected",
    resumeUrl: "https://example.com/resume4.pdf",
  },
  {
    id: 5,
    name: "Vikram Singh",
    email: "vikram.singh@gmail.com",
    phone: "+91-9876543214",
    location: "Hyderabad, India",
    topMatch: "DevOps Engineer",
    aiScore: 85,
    submittedAt: new Date().toLocaleDateString("en-IN"),
    status: "pending",
    resumeUrl: "https://example.com/resume5.pdf",
  },
];
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