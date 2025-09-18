import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export default async function evaluateInterview(transcript) {
  const systemInstructions = `
    You are an expert interview evaluator. You will be given an array of messages from an interview transcript. Each message has a "role" (either "user" for candidate or "assistant" for interviewer) and a "text".

Your task:
1. Read the transcript carefully.
2. Focus only on the candidate's answers (role: "user").
3. Evaluate the candidate on these dimensions:
   - Clarity (1–10)
   - Problem Solving Ability (1–10)
   - Communication Skills (1–10)
   - Confidence (1–10)
   - Technical Correctness (1–10)
4. Provide a short summary of overall performance, strengths, and areas for improvement.
5. Output strictly in JSON format:

{
  "clarity": number,
  "problemSolving": number,
  "communication": number,
  "confidence": number,
  "technical": number,
  "overallFeedback": "string"
}

Do not include any text outside of the JSON.
`;
  const prompt = `
Here is the interview transcript:
---
${transcript}
---

// Evaluate it.

Criteria:
1. clarity
2. problem solving
3. communication skills
4. confidence
5. technical correctness

Give numeric scores from 1 (poor) to 10 (excellent) for each.

Provide overall feedback summarizing strengths and areas for improvement.
`;

  const model = new ChatGroq({
    apiKey: import.meta.env.VITE_GROQ_API,
    model: "llama-3.3-70b-versatile",
    temperature: 0,
  });

  const messages = [
    new SystemMessage(systemInstructions),
    new HumanMessage(prompt),
  ];

  const result = await model.invoke(messages);
  console.log(result.content);
  return result.content;
}
