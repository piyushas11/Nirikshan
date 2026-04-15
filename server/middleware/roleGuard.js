/**
 * roleGuard(roles)
 * Middleware factory that restricts access to users with specific roles.
 * Must be used AFTER the auth middleware (req.user must be set).
 */
const roleGuard = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
        your_role: req.user.role,
      });
    }

    next();
  };
};

export default roleGuard;