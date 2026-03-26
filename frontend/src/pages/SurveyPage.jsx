import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const SurveyPage = () => {
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [copied, setCopied] = useState(false);

  /* ---------------- FETCH SURVEY ---------------- */

  useEffect(() => {
    const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
    const found = surveys.find((s) => s.id === id);
    setSurvey(found);
  }, [id]);

  /* ---------------- HANDLE ANSWERS ---------------- */

  const handleChange = (qIndex, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: value,
    }));
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = (e) => {
    e.preventDefault();

    const responseData = {
      surveyId: id,
      answers,
      submittedAt: new Date().toISOString(),
    };

    console.log("Submitted Response:", responseData);

    // Save responses (localStorage for now)
    const existing =
      JSON.parse(localStorage.getItem("responses")) || [];
    existing.push(responseData);
    localStorage.setItem("responses", JSON.stringify(existing));

    alert("Response submitted successfully ✅");
  };

  /* ---------------- COPY LINK ---------------- */

  const surveyLink = `${window.location.origin}/survey/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(surveyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ---------------- LOADING / ERROR ---------------- */

  if (!survey) {
    return (
      <div style={styles.center}>
        <h2>Survey not found ❌</h2>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Share Link */}
        <div style={styles.shareBox}>
          <p style={styles.shareTitle}>Share this survey</p>

          <div style={styles.linkRow}>
            <input value={surveyLink} readOnly style={styles.linkInput} />
            <button onClick={handleCopy} style={styles.copyBtn}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>{survey.title}</h1>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {survey.questions.map((q, index) => (
            <div key={index} style={styles.questionCard}>
              <label style={styles.questionText}>
                {index + 1}. {q.text}
              </label>

              {/* Short Answer */}
              {q.type === "Short Answer" && (
                <input
                  type="text"
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  style={styles.input}
                />
              )}

              {/* Long Answer */}
              {q.type === "Long Answer" && (
                <textarea
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  style={styles.textarea}
                />
              )}

              {/* Email */}
              {q.type === "Email" && (
                <input
                  type="email"
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  style={styles.input}
                />
              )}

              {/* Phone */}
              {q.type === "Phone" && (
                <input
                  type="tel"
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  style={styles.input}
                />
              )}

              {/* Date */}
              {q.type === "Date" && (
                <input
                  type="date"
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  style={styles.input}
                />
              )}

              {/* MCQ */}
              {q.type === "MCQ" &&
                q.options.map((opt, i) => (
                  <label key={i} style={styles.option}>
                    <input
                      type="radio"
                      name={`q-${index}`}
                      value={opt}
                      checked={answers[index] === opt}
                      onChange={(e) =>
                        handleChange(index, e.target.value)
                      }
                    />
                    {opt}
                  </label>
                ))}

              {/* Dropdown */}
              {q.type === "Dropdown" && (
                <select
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="">Select an option</option>
                  {q.options.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <button type="submit" style={styles.submitBtn}>
            Submit Response
          </button>
        </form>
      </div>
    </div>
  );
};

export default SurveyPage;

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
    maxWidth: "700px",
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  title: {
    marginBottom: "20px",
    textAlign: "center",
  },

  shareBox: {
    marginBottom: "20px",
    padding: "15px",
    background: "#f5f7ff",
    borderRadius: "10px",
  },

  shareTitle: {
    marginBottom: "8px",
    fontWeight: "bold",
  },

  linkRow: {
    display: "flex",
    gap: "10px",
  },

  linkInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  copyBtn: {
    padding: "10px 15px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  questionCard: {
    marginBottom: "20px",
    padding: "15px",
    borderRadius: "10px",
    background: "#fafafa",
    border: "1px solid #eee",
  },

  questionText: {
    display: "block",
    marginBottom: "10px",
    fontWeight: "500",
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    minHeight: "80px",
  },

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
  },

  option: {
    display: "block",
    marginBottom: "6px",
  },

  submitBtn: {
    width: "100%",
    marginTop: "20px",
    padding: "14px",
    background: "linear-gradient(to right, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },

  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};