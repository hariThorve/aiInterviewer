import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import evaluateInterview from "../evaluateMetrics";
import axios from "axios";

const Interview = ({ apiKey, assistantId, userId, config = {} }) => {
  const [vapi, setVapi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);

  // take the raw transcript and format it in the form of
  // [{
  //   role : string
  //    message : string
  //   }]
  function formatVapiTranscript(transcriptArray) {
    if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
      return [];
    }

    const result = [];
    let currentRole = null;
    let currentText = "";

    for (let i = 0; i < transcriptArray.length; i++) {
      const item = transcriptArray[i];

      // Skip if item doesn't have required properties
      if (!item.role || !item.text) {
        continue;
      }

      // If role changes, save the previous message and start new one
      if (item.role !== currentRole) {
        // Save previous message if it exists
        if (currentRole && currentText.trim()) {
          result.push({
            role: currentRole,
            text: currentText.trim(),
          });
        }

        // Start new message
        currentRole = item.role;
        currentText = item.text;
      } else {
        // Same role - check if this text is longer and contains the previous text
        // This handles the progressive text building in Vapi
        if (
          item.text.length > currentText.length &&
          item.text.startsWith(currentText.trim())
        ) {
          currentText = item.text;
        } else if (!currentText.includes(item.text) && item.text.trim()) {
          // If it's a completely new sentence, append it
          currentText += " " + item.text;
        }
      }
    }

    // Don't forget the last message
    if (currentRole && currentText.trim()) {
      result.push({
        role: currentRole,
        text: currentText.trim(),
      });
    }

    return result;
  }

  // convert the array of objects in the form of strings in
  // order to make llms understand for evaluation
  function formatTranscriptForLLM(transcriptArray) {
    const formattedTranscript = formatVapiTranscript(transcriptArray);

    // Convert to readable string format
    let transcriptString = "INTERVIEW TRANSCRIPT:\n\n";

    formattedTranscript.forEach((message, index) => {
      const speaker =
        message.role === "assistant" ? "AI INTERVIEWER" : "CANDIDATE";
      transcriptString += `${speaker}: ${message.text}\n\n`;
    });

    return transcriptString;
  }
  useEffect(() => {
    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on("call-start", () => {
      setIsConnected(true);
    });

    vapiInstance.on("call-end", () => {
      setIsConnected(false);
      setIsSpeaking(false);
    });

    vapiInstance.on("speech-start", () => {
      setIsSpeaking(true);
    });

    vapiInstance.on("speech-end", () => {
      setIsSpeaking(false);
    });

    vapiInstance.on("message", (message) => {
      if (message.type === "transcript") {
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role,
            text: message.transcript,
          },
        ]);
      }
    });

    vapiInstance.on("error", (error) => {
      console.error("Vapi error:", error);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [apiKey]);

  const startCall = () => {
    if (vapi) {
      vapi.start(assistantId, config);
    }
  };

  const endCall = () => {
    if (vapi) {
      vapi.stop();
      var formattedResult = formatVapiTranscript(transcript);
      var transcriptString = formatTranscriptForLLM(formattedResult);
      console.log(transcriptString);
      console.log(formattedResult);

      async function run(result, userId) {
        try {
          // Get evaluation from AI
          const evaluation = await evaluateInterview(result);
          console.log("Evaluation:", evaluation);

          // Update user performance in database
          if (userId) {
            const response = await axios.put(
              `http://localhost:3000/users/${userId}/performance`,
              { performanceDetails: evaluation },
              { headers: { "Content-Type": "application/json" } },
            );

            console.log("Performance updated successfully:", response.data);
          }
        } catch (error) {
          console.error("Error updating performance:", error);
        }
      }

      run(transcriptString, userId);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        background:
          "radial-gradient(1000px 600px at 80% 10%, rgba(18,165,148,0.08) 0%, rgba(0,0,0,0) 60%),\nradial-gradient(800px 500px at 20% 90%, rgba(99,102,241,0.10) 0%, rgba(0,0,0,0) 60%), #0b0f14",
        color: "#e6ebf3",
      }}
    >
      {!isConnected ? (
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "0.3px",
                color: "#f0f7ff",
              }}
            >
              Ready for your interview?
            </div>
            <button
              onClick={startCall}
              style={{
                background: "linear-gradient(135deg, #12A594 0%, #1DEBB5 100%)",
                color: "#0a0e13",
                border: "none",
                borderRadius: "14px",
                padding: "16px 28px",
                fontSize: "16px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  "0 10px 30px rgba(18, 165, 148, 0.35), inset 0 0 20px rgba(255,255,255,0.2)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 40px rgba(18, 165, 148, 0.45), inset 0 0 26px rgba(255,255,255,0.28)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(18, 165, 148, 0.35), inset 0 0 20px rgba(255,255,255,0.2)";
              }}
            >
              Start Interview
            </button>
            <div
              style={{
                fontSize: "13px",
                color: "#8ea6c1",
              }}
            >
              Microphone access required. Click to begin.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "18px",
            height: "100%",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateRows: "1fr auto",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
              }}
            >
              {/* User tile */}
              <div
                style={{
                  position: "relative",
                  background:
                    "linear-gradient(180deg, rgba(15,20,28,0.9) 0%, rgba(11,15,20,0.9) 100%)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(99,102,241,0.22)",
                  boxShadow:
                    "0 10px 40px rgba(99,102,241,0.20), inset 0 0 40px rgba(99,102,241,0.12)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(800px 300px at 20% 100%, rgba(18,165,148,0.06) 0%, rgba(0,0,0,0) 50%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#22d3ee",
                      boxShadow: "0 0 12px #22d3ee",
                    }}
                  />
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#cfe7ff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    You
                  </div>
                </div>
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: "#9fb5cd",
                    letterSpacing: "0.05em",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))",
                      border: "2px solid rgba(99,102,241,0.35)",
                      boxShadow:
                        "0 0 24px rgba(99,102,241,0.25), inset 0 0 40px rgba(34,211,238,0.12)",
                    }}
                  />
                </div>
              </div>

              {/* AI tile */}
              <div
                style={{
                  position: "relative",
                  background:
                    "linear-gradient(180deg, rgba(15,20,28,0.9) 0%, rgba(11,15,20,0.9) 100%)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(18,165,148,0.28)",
                  boxShadow:
                    "0 10px 40px rgba(18,165,148,0.22), inset 0 0 40px rgba(18,165,148,0.12)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(800px 300px at 80% 100%, rgba(99,102,241,0.07) 0%, rgba(0,0,0,0) 50%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: isSpeaking ? "#fb7185" : "#22c55e",
                      boxShadow: isSpeaking
                        ? "0 0 14px #fb7185"
                        : "0 0 10px #22c55e",
                      animation: isSpeaking
                        ? "pulseGlow 1.2s ease-in-out infinite"
                        : "none",
                    }}
                  />
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#cfe7ff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    AI Assistant
                  </div>
                </div>
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: "#9fb5cd",
                    letterSpacing: "0.05em",
                  }}
                >
                  <div
                    style={{
                      width: isSpeaking ? "132px" : "120px",
                      height: isSpeaking ? "132px" : "120px",
                      transition: "all 0.25s ease",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, rgba(18,165,148,0.18), rgba(34,197,94,0.18))",
                      border: "2px solid rgba(18,165,148,0.45)",
                      boxShadow:
                        "0 0 26px rgba(18,165,148,0.28), inset 0 0 46px rgba(34,197,94,0.14)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                background:
                  "linear-gradient(180deg, rgba(17,24,39,0.65) 0%, rgba(11,15,20,0.65) 100%)",
                border: "1px solid rgba(148,163,184,0.15)",
                borderRadius: "16px",
                padding: "14px",
                boxShadow: "0 8px 30px rgba(15,23,42,0.45)",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  color: "#9fb5cd",
                  fontSize: "13px",
                  border: "1px solid rgba(148,163,184,0.12)",
                  background: "rgba(2,6,12,0.35)",
                }}
              >
                {isSpeaking ? "Assistant Speaking…" : "Listening…"}
              </div>

              <button
                onClick={endCall}
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #fb7185 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  boxShadow: "0 8px 24px rgba(239,68,68,0.35)",
                  transition: "transform 0.2s ease, filter 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.filter = "brightness(1.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.filter = "brightness(1.0)";
                }}
              >
                End Call
              </button>
            </div>
          </div>

          {/* Chat / Transcript */}
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(17,24,39,0.6) 0%, rgba(11,15,20,0.7) 100%)",
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.15)",
              boxShadow: "0 10px 35px rgba(2,6,12,0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 14px",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: "#d8e6f9",
                  letterSpacing: "0.06em",
                }}
              >
                Transcript
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#8aa2ba",
                }}
              >
                {transcript.length} messages
              </div>
            </div>
            <div
              style={{
                padding: "14px",
                gap: "8px",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {transcript.length === 0 ? (
                <div
                  style={{
                    color: "#8aa2ba",
                    fontSize: "14px",
                    opacity: 0.85,
                  }}
                >
                  Conversation will appear here…
                </div>
              ) : (
                transcript.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <span
                      style={{
                        background:
                          msg.role === "user"
                            ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(33,150,243,0.22))"
                            : "linear-gradient(135deg, rgba(18,165,148,0.28), rgba(34,197,94,0.22))",
                        color: "#e6ebf3",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        display: "inline-block",
                        fontSize: "13px",
                        maxWidth: "85%",
                        border: "1px solid rgba(148,163,184,0.12)",
                        boxShadow: "0 6px 20px rgba(2,6,12,0.45)",
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(251,113,133,0.0)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(251,113,133,0.6)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(251,113,133,0.0)); }
        }
      `}</style>
    </div>
  );
};

export default Interview;

// Usage in your app:
// <VapiWidget
//   apiKey="your_public_api_key"
//   assistantId="your_assistant_id"
// />
