import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Step 1: Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    // ✅ Step 2: Insert into profiles table
    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id, // 🔥 VERY IMPORTANT
            email: form.email,
            name: form.name,
            phone: form.phone || "",
          },
        ]);

      if (profileError) {
        console.log("Profile error:", profileError.message);
      }
    }

    alert("Signup successful! Please login.");
    setLoading(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-xl">

        <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>

        <form onSubmit={handleSignup} className="space-y-4">

          <input
            type="text"
            placeholder="Name"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <input
            type="text"
            placeholder="Phone (optional)"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <button
            type="submit"
            className="w-full bg-green-500 py-3 rounded-lg font-bold hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-4 text-center">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-400 cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
};

export default Signup;