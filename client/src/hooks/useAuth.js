import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();
  }, []);

  return { user };
};