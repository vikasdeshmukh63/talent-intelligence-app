import { Op } from "sequelize";
import { User } from "../models/user.model.js";
import { InterviewerBusySlot } from "../models/interviewer-busy-slot.model.js";
import { InterviewBooking } from "../models/interview-booking.model.js";
import { Application } from "../models/application.model.js";
import { sendMail } from "../services/mail.service.js";
import {
  buildInterviewCandidateEmailHtml,
  buildInterviewHostEmailHtml,
} from "../services/mail-templates.js";
import { sequelize } from "../config/database.js";
import { createTeamsOnlineMeeting } from "../services/teams.service.js";

const HOST_ROLES = ["recruiter", "interviewer"];

export const listInterviewHosts = async (_req, res) => {
  const users = await User.findAll({
    where: { role: { [Op.in]: HOST_ROLES }, emailVerified: true },
    attributes: ["id", "name", "email", "role"],
    order: [["name", "ASC"]],
  });
  return res.json({
    hosts: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    })),
  });
};

export const getAvailability = async (req, res) => {
  const hostUserId = Number(req.params.userId);
  const date = typeof req.query.date === "string" ? req.query.date.trim() : "";
  if (!hostUserId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "userId and date (YYYY-MM-DD) are required" });
  }
  const host = await User.findByPk(hostUserId);
  if (!host || !HOST_ROLES.includes(host.role)) {
    return res.status(404).json({ message: "Host not found" });
  }
  const busyRows = await InterviewerBusySlot.findAll({
    where: { userId: hostUserId, date },
    attributes: ["timeSlot"],
  });
  const bookingRows = await InterviewBooking.findAll({
    where: { interviewerId: hostUserId, scheduledDate: date },
    attributes: ["timeSlot"],
  });
  const busySlots = [...new Set([...busyRows.map((r) => r.timeSlot), ...bookingRows.map((r) => r.timeSlot)])];
  return res.json({ busySlots });
};

export const getMySchedule = async (req, res) => {
  const userId = req.user.id;
  const manual = await InterviewerBusySlot.findAll({
    where: { userId },
    order: [
      ["date", "ASC"],
      ["timeSlot", "ASC"],
    ],
  });
  const hosting = await InterviewBooking.findAll({
    where: { interviewerId: userId },
    order: [
      ["scheduledDate", "ASC"],
      ["timeSlot", "ASC"],
    ],
    include: [{ model: User, as: "recruiter", attributes: ["id", "name", "email"] }],
  });
  const scheduledByMe = await InterviewBooking.findAll({
    where: { recruiterId: userId },
    order: [
      ["scheduledDate", "ASC"],
      ["timeSlot", "ASC"],
    ],
    include: [{ model: User, as: "interviewer", attributes: ["id", "name", "email"] }],
  });
  return res.json({
    manualBusy: manual.map((r) => ({ id: r.id, date: r.date, timeSlot: r.timeSlot })),
    hostingInterviews: hosting.map((b) => ({
      id: b.id,
      scheduledDate: b.scheduledDate,
      timeSlot: b.timeSlot,
      candidateName: b.candidateName,
      candidateEmail: b.candidateEmail,
      jobTitle: b.jobTitle,
      recruiter: b.recruiter ? { name: b.recruiter.name, email: b.recruiter.email } : null,
    })),
    scheduledByMe: scheduledByMe.map((b) => ({
      id: b.id,
      scheduledDate: b.scheduledDate,
      timeSlot: b.timeSlot,
      candidateName: b.candidateName,
      jobTitle: b.jobTitle,
      interviewer: b.interviewer ? { id: b.interviewer.id, name: b.interviewer.name, email: b.interviewer.email } : null,
    })),
  });
};

export const addMyBusy = async (req, res) => {
  const userId = req.user.id;
  const { date, timeSlot } = req.body || {};
  if (!date || !timeSlot || typeof date !== "string" || typeof timeSlot !== "string") {
    return res.status(400).json({ message: "date and timeSlot are required" });
  }
  const taken = await InterviewBooking.findOne({
    where: { interviewerId: userId, scheduledDate: date, timeSlot },
  });
  if (taken) {
    return res.status(409).json({ message: "That slot already has a scheduled interview" });
  }
  const [row] = await InterviewerBusySlot.findOrCreate({
    where: { userId, date, timeSlot },
    defaults: { userId, date, timeSlot },
  });
  return res.status(201).json({ slot: { id: row.id, date: row.date, timeSlot: row.timeSlot } });
};

export const removeMyBusy = async (req, res) => {
  const userId = req.user.id;
  const date = req.query.date;
  const timeSlot = req.query.timeSlot;
  if (!date || !timeSlot) {
    return res.status(400).json({ message: "date and timeSlot query params are required" });
  }
  const n = await InterviewerBusySlot.destroy({ where: { userId, date, timeSlot } });
  return res.json({ removed: n > 0 });
};

export const createInterviewBooking = async (req, res) => {
  const recruiterId = req.user.id;
  const {
    interviewerHostUserId,
    interviewerHostUserIds,
    scheduledDate,
    timeSlot,
    candidateName,
    candidateEmail,
    jobTitle,
    applicationId,
    emailBody,
  } = req.body || {};

  const hostIdsRaw = Array.isArray(interviewerHostUserIds)
    ? interviewerHostUserIds
    : interviewerHostUserId != null
      ? [interviewerHostUserId]
      : [];
  const hostIds = [...new Set(hostIdsRaw.map((x) => Number(x)).filter(Boolean))];

  if (hostIds.length === 0 || !scheduledDate || !timeSlot || !candidateName || !candidateEmail || !jobTitle) {
    return res.status(400).json({
      message:
        "interviewerHostUserIds (or interviewerHostUserId), scheduledDate, timeSlot, candidateName, candidateEmail, jobTitle are required",
    });
  }

  const hosts = await User.findAll({
    where: { id: { [Op.in]: hostIds }, role: { [Op.in]: HOST_ROLES }, emailVerified: true },
    attributes: ["id", "name", "email", "role"],
    order: [["name", "ASC"]],
  });
  if (hosts.length !== hostIds.length) {
    return res.status(400).json({ message: "One or more selected hosts are invalid" });
  }

  const busy = await InterviewerBusySlot.findOne({
    where: { userId: { [Op.in]: hostIds }, date: scheduledDate, timeSlot },
  });
  if (busy) {
    return res.status(409).json({ message: "One of the selected hosts is busy at this time" });
  }
  const existing = await InterviewBooking.findOne({
    where: { interviewerId: { [Op.in]: hostIds }, scheduledDate, timeSlot },
  });
  if (existing) {
    return res.status(409).json({ message: "This slot is already booked for one of the selected hosts" });
  }

  const candidateEmailNorm = String(candidateEmail).trim().toLowerCase();
  const payloadBase = {
    recruiterId,
    applicationId: applicationId != null ? Number(applicationId) || null : null,
    candidateName: String(candidateName).trim(),
    candidateEmail: candidateEmailNorm,
    jobTitle: String(jobTitle).trim(),
    scheduledDate: String(scheduledDate).trim(),
    timeSlot: String(timeSlot).trim(),
  };

  const created = await sequelize.transaction(async (t) => {
    const rows = [];
    for (const h of hosts) {
      const b = await InterviewBooking.create(
        {
          ...payloadBase,
          interviewerId: h.id,
        },
        { transaction: t }
      );
      rows.push(b);
    }
    return rows;
  });

  if (payloadBase.applicationId) {
    try {
      const app = await Application.findByPk(payloadBase.applicationId, {
        include: [{ association: "job", attributes: ["id", "recruiterId"] }],
      });
      if (app?.job?.recruiterId === recruiterId && app.status !== "HR Interview Scheduled") {
        app.status = "HR Interview Scheduled";
        await app.save();
      }
    } catch (e) {
      console.warn("[interview] failed to auto-update application status:", e?.message || e);
    }
  }

  let teams = null;
  try {
    teams = await createTeamsOnlineMeeting({
      subject: `Interview — ${payloadBase.jobTitle} — ${payloadBase.candidateName}`,
      scheduledDate: payloadBase.scheduledDate,
      timeSlot: payloadBase.timeSlot,
      candidateEmail: candidateEmailNorm,
    });
  } catch (e) {
    console.warn("[teams] meeting create failed:", e?.message || e);
    teams = null;
  }

  if (teams?.joinUrl) {
    try {
      await InterviewBooking.update(
        { teamsJoinUrl: teams.joinUrl, teamsMeetingId: teams.meetingId || null },
        { where: { id: { [Op.in]: created.map((b) => b.id) } } }
      );
    } catch (e) {
      console.warn("[teams] failed to persist join url:", e?.message || e);
    }
  }

  const safeBody = String(emailBody || "").trim();
  const hostNames = hosts.map((h) => h.name).join(", ");
  const safeBodyHtml =
    safeBody.length > 0
      ? safeBody
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>")
      : "";
  const candidateHtml = buildInterviewCandidateEmailHtml({
    candidateName: payloadBase.candidateName,
    jobTitle: payloadBase.jobTitle,
    scheduledDate: payloadBase.scheduledDate,
    timeSlot: payloadBase.timeSlot,
    hostNames,
    customBodyHtml: safeBodyHtml ? `<div>${safeBodyHtml}</div>` : undefined,
    teamsJoinUrl: teams?.joinUrl || null,
  });

  await sendMail({
    to: candidateEmailNorm,
    subject: `Interview scheduled — ${payloadBase.jobTitle}`,
    html: candidateHtml,
  });

  try {
    for (const h of hosts) {
      const hostHtml = buildInterviewHostEmailHtml({
        hostName: h.name,
        jobTitle: payloadBase.jobTitle,
        scheduledDate: payloadBase.scheduledDate,
        timeSlot: payloadBase.timeSlot,
        candidateName: payloadBase.candidateName,
        candidateEmail: candidateEmailNorm,
        hostNames,
        teamsJoinUrl: teams?.joinUrl || null,
      });
      await sendMail({
        to: h.email,
        subject: `Interview booked — ${payloadBase.jobTitle}`,
        html: hostHtml,
      });
    }
  } catch (_e) {
    // Host notification is best-effort
  }

  return res.status(201).json({
    booking: {
      id: created[0]?.id,
      scheduledDate: payloadBase.scheduledDate,
      timeSlot: payloadBase.timeSlot,
      interviewerName: hostNames,
    },
  });
};
