import { useState } from "react";

const BACKEND = "https://yt-rag-backend-3zw5.onrender.com";

function App() {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [message, setMessage] = useState("");

  const loadVideo = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${BACKEND}/load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideoLoaded(true);
        setMessage("✅ Video loaded! Ask your question.");
      } else {
        setMessage(`❌ ${data.detail}`);
      }
    } catch {
      setMessage("❌ Could not connect to backend.");
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch(`${BACKEND}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnswer(data.answer);
      } else {
        setAnswer(`❌ ${data.detail}`);
      }
    } catch {
      setAnswer("❌ Could not connect to backend.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "700px", margin: "60px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1>🎥 YouTube RAG Chatbot</h1>

      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Paste YouTube URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "16px", marginBottom: "10px", boxSizing: "border-box" }}
        />
        <button onClick={loadVideo} disabled={loading || !url} style={{ padding: "10px 20px", fontSize: "16px" }}>
          {loading && !videoLoaded ? "Loading..." : "Load Video"}
        </button>
        {message && <p>{message}</p>}
      </div>

      {videoLoaded && (
        <div>
          <input
            type="text"
            placeholder="Ask a question about the video..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ width: "100%", padding: "10px", fontSize: "16px", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <button onClick={askQuestion} disabled={loading || !question} style={{ padding: "10px 20px", fontSize: "16px" }}>
            {loading ? "Thinking..." : "Ask"}
          </button>

          {answer && (
            <div style={{ marginTop: "24px", padding: "16px", background: "#f0f0f0", borderRadius: "8px" }}>
              <strong>Answer:</strong>
              <p>{answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
