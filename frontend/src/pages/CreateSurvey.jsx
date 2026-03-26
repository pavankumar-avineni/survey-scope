import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const QUESTION_TYPES = [
  "Short Answer",
  "Long Answer",
  "MCQ",
  "Dropdown",
  "Email",
  "Phone",
  "Date",
];

const CreateSurvey = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", type: "Short Answer", options: [] },
  ]);

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", type: "Short Answer", options: [] },
    ]);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (index) => {
    const updated = [...questions];
    updated[index].options.push("");
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const moveQuestion = (index, direction) => {
    const updated = [...questions];
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    [updated[index], updated[target]] = [
      updated[target],
      updated[index],
    ];
    setQuestions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const surveyId = Date.now().toString();

    const newSurvey = { id: surveyId, title, questions };

    const existing = JSON.parse(localStorage.getItem("surveys")) || [];
    existing.push(newSurvey);
    localStorage.setItem("surveys", JSON.stringify(existing));

    navigate(`/survey/${surveyId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Create Survey</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter survey title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.titleInput}
            required
          />

          {questions.map((q, index) => (
            <div key={index} style={styles.questionCard}>
              <div style={styles.topRow}>
                <input
                  type="text"
                  placeholder={`Question ${index + 1}`}
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(index, "text", e.target.value)
                  }
                  style={styles.input}
                  required
                />

                <select
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(index, "type", e.target.value)
                  }
                  style={styles.select}
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              {(q.type === "MCQ" || q.type === "Dropdown") && (
                <div>
                  {q.options.map((opt, i) => (
                    <div key={i} style={styles.optionRow}>
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(index, i, e.target.value)
                        }
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index, i)}
                        style={styles.iconBtn}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(index)}
                    style={styles.addOptionBtn}
                  >
                    + Add Option
                  </button>
                </div>
              )}

              <div style={styles.actions}>
                <button type="button" onClick={() => moveQuestion(index, -1)}>
                  ↑
                </button>
                <button type="button" onClick={() => moveQuestion(index, 1)}>
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(index)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} style={styles.addBtn}>
            + Add Question
          </button>

          <button type="submit" style={styles.submitBtn}>
            Create Survey
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSurvey;

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
    maxWidth: "750px",
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  heading: {
    textAlign: "center",
    marginBottom: "20px",
  },

  titleInput: {
    width: "100%",
    padding: "14px",
    fontSize: "18px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "20px",
  },

  questionCard: {
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "15px",
    background: "#fafafa",
  },

  topRow: {
    display: "flex",
    gap: "10px",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  select: {
    padding: "10px",
    borderRadius: "8px",
  },

  optionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },

  addOptionBtn: {
    marginTop: "10px",
    background: "#e3e8ff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  iconBtn: {
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  actions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },

  deleteBtn: {
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
  },

  addBtn: {
    marginTop: "10px",
    padding: "10px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    width: "100%",
  },

  submitBtn: {
    marginTop: "20px",
    padding: "14px",
    width: "100%",
    background: "linear-gradient(to right, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
  },
};