
import { GoogleGenAI, Type } from "@google/genai";
import type { Question, GradedResult } from '../types';

const getPrompt = (question: Question, userAnswer: string): string => `
  You are a strictly professional military doctrine instructor.
  Task: Evaluate the student's answer strictly based ONLY on the provided "Source Text".
  
  --- SOURCE TEXT FROM MANUAL ---
  ${question.sourceText}
  --- END SOURCE ---

  Question: ${question.question}
  Student Answer: "${userAnswer}"
  
  Instructions:
  1. Analyze if the student's answer captures the core meaning of the Source Text.
  2. Return JSON with exactly these keys:
     - "score": number (0-100). Base the score on completeness, accuracy, and relevance to the source text.
     - "feedback": Hebrew string. Direct, constructive feedback to the student explaining what was right and what was wrong in their answer.
     - "correction": Hebrew string. The ideal, perfect answer, derived ONLY from the provided source text.
  
  IMPORTANT: Return ONLY a single, valid JSON object and nothing else.
`;

export const gradeAnswer = async (question: Question, userAnswer: string, apiKey: string): Promise<GradedResult> => {
  if (!apiKey) {
    return { score: 0, feedback: "מפתח API חסר. אנא הגדר אותו.", correction: "שגיאה בתקשורת עם השרת." };
  }
  if (!userAnswer || !userAnswer.trim()) {
    return { score: 0, feedback: "לא הוזנה תשובה.", correction: "יש לספק תשובה על מנת לקבל ציון." };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{text: getPrompt(question, userAnswer)}] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                    correction: { type: Type.STRING },
                },
                required: ["score", "feedback", "correction"],
            },
            seed: 42,
        },
    });
    
    const text = response.text.trim();
    const parsed = JSON.parse(text);

    return {
      score: parsed.score || 0,
      feedback: parsed.feedback || "לא התקבל משוב מהמודל.",
      correction: parsed.correction || "לא התקבל תיקון מהמודל.",
    };

  } catch (error) {
    console.error("Error grading answer with Gemini API:", error);
    let feedback = "שגיאה בבדיקת התשובה. נסה שוב מאוחר יותר.";
    if (error instanceof Error && error.message.includes('API key not valid')) {
        feedback = "מפתח ה-API אינו תקין. אנא בדוק אותו בהגדרות.";
    }
    return {
      score: 0,
      feedback,
      correction: "לא ניתן היה לקבל תשובה נכונה עקב שגיאה.",
    };
  }
};
