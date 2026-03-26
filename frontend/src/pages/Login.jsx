import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({
  email: "",
  password: "",
});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      const res = await API.post("/auth/login", form);

      console.log(res.data);

      // store token (optional)
      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");

    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-600">

      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-[400px] border border-white/20">

        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Welcome Back 👋
        </h2>

        <p className="text-center text-gray-500 mb-6 text-sm">
          Login to continue to your dashboard
        </p>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 mb-4 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onChange={handleChange}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p
          className="text-center text-sm mt-5 text-gray-600 cursor-pointer hover:text-indigo-500"
          onClick={() => navigate("/register")}
        >
          Don't have an account? Register
        </p>
      </div>
    </div>
  );
}

export default Login;