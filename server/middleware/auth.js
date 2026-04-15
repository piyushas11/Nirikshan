import { supabase } from "../config/supabase.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = {
      ...data.user,
      role:
        data.user.app_metadata?.role ||
        data.user.user_metadata?.role ||
        "citizen",
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export default auth;