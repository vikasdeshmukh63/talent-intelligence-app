export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const assignedRoles = [
      req.user.role,
      ...(Array.isArray(req.user.additionalRoles) ? req.user.additionalRoles : []),
    ].filter(Boolean);
    const hasAllowedRole = assignedRoles.some((r) => roles.includes(r));
    if (!hasAllowedRole) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
