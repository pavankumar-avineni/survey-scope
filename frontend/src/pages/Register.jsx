import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      setError("");
      setSuccess("");

      const res = await API.post("/auth/register", form);

      setSuccess("Account created successfully 🎉");

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.error || "Registration failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px]">

        <h2 className="text-3xl font-bold text-center mb-6">
          Create Account
        </h2>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="bg-green-100 text-green-600 p-2 mb-4 rounded text-sm">
            {success}
          </div>
        )}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={handleChange}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p
          className="text-center text-sm mt-4 text-gray-600 cursor-pointer hover:text-blue-500"
          onClick={() => navigate("/")}
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Register;