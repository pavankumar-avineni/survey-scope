import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import CreateSurvey from "../pages/CreateSurvey";
import SurveyPage from "../pages/SurveyPage";
import Responses from "../pages/Responses";
import Dashboard from "../pages/Dashboard"; // ✅ FIX

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/create" element={<CreateSurvey />} />
        <Route path="/survey/:id" element={<SurveyPage />} />
        <Route path="/responses" element={<Responses />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ now works */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;