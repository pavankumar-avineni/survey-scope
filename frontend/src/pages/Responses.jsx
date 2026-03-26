import React, { useEffect, useState } from "react";

const Responses = () => {
  const [responses, setResponses] = useState([]);
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    // Load responses
    const storedResponses =
      JSON.parse(localStorage.getItem("responses")) || [];

    // Load surveys (to show question text)
    const storedSurveys =
      JSON.parse(localStorage.getItem("surveys")) || [];

    setResponses(storedResponses);
    setSurveys(storedSurveys);
  }, []);

  /* ---------------- HELPER ---------------- */

  const getSurveyById = (id) => {
    return surveys.find((s) => s.id === id);
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Responses</h1>

        {responses.length === 0 ? (
          <p style={styles.empty}>No responses yet 😢</p>
        ) : (
          responses.map((res, index) => {
            const survey = getSurveyById(res.surveyId);

            return (
              <div key={index} style={styles.responseCard}>
                <h3 style={styles.surveyTitle}>
                  {survey?.title || "Unknown Survey"}
                </h3>

                <p style={styles.date}>
                  Submitted:{" "}
                  {new Date(res.submittedAt).toLocaleString()}
                </p>

                <div style={styles.answers}>
                  {survey?.questions.map((q, i) => (
                    <div key={i} style={styles.answerItem}>
                      <strong>{q.text}</strong>
                      <p>
                        {res.answers[i] || (
                          <span style={{ color: "#999" }}>
                            No answer
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Responses;

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to right, #5f9cff, #7a5fff)",
    display: "flex",
    justifyContent: "center",
    padding: "30px",
  },

  card: {
    width: "100%",
    maxWidth: "800px",
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  empty: {
    textAlign: "center",
    color: "#777",
  },

  responseCard: {
    marginBottom: "20px",
    padding: "20px",
    borderRadius: "12px",
    background: "#f9f9ff",
    border: "1px solid #eee",
  },

  surveyTitle: {
    marginBottom: "5px",
  },

  date: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "10px",
  },

  answers: {
    marginTop: "10px",
  },

  answerItem: {
    marginBottom: "10px",
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
};