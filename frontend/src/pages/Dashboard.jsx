import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h2 style={{ color: "#fff" }}>Survey Dashboard</h2>
        <button style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome Back 👋</h1>
        <p style={styles.subtitle}>
          Manage your surveys, create new ones, and view responses easily.
        </p>

        {/* Cards */}
        <div style={styles.cardContainer}>
          <div style={styles.card} onClick={() => navigate("/create")}>
            <h3>Create Survey</h3>
            <p>Design and launch a new survey</p>
          </div>

          <div style={styles.card} onClick={() => navigate("/responses")}>
            <h3>View Responses</h3>
            <p>Analyze submitted survey data</p>
          </div>

          <div style={styles.card} onClick={() => navigate("/admin")}>
            <h3>Admin Panel</h3>
            <p>Manage users and surveys</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to right, #667eea, #764ba2)",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "rgba(0,0,0,0.2)",
  },

  logoutBtn: {
    padding: "8px 15px",
    border: "none",
    borderRadius: "6px",
    background: "#ff4d4d",
    color: "#fff",
    cursor: "pointer",
  },

  content: {
    padding: "40px",
    color: "#fff",
    textAlign: "center",
  },

  title: {
    fontSize: "32px",
    marginBottom: "10px",
  },

  subtitle: {
    marginBottom: "30px",
    opacity: 0.9,
  },

  cardContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  card: {
    width: "250px",
    padding: "20px",
    borderRadius: "12px",
    background: "#fff",
    color: "#333",
    cursor: "pointer",
    transition: "0.3s",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },
};