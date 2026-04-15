/**
 * Global Express error handler.
 * Must be registered LAST in server/index.js:
 *   app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message || err);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large. Max 10MB." });
  }
  if (err.message === "Only image files are allowed") {
    return res.status(415).json({ message: err.message });
  }

  // Supabase / Postgres errors
  if (err.code === "23505") {
    return res.status(409).json({ message: "Duplicate entry" });
  }
  if (err.code === "23503") {
    return res.status(400).json({ message: "Referenced record does not exist" });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return res.status(status).json({ message });
};

module.exports = errorHandler;