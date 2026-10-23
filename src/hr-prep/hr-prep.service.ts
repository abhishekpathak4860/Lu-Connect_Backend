import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class HrPrepService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async generateQuestions(company: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Generate 3 realistic HR/Behavioral interview questions that a candidate might face when interviewing at ${company}. Make them specific to the culture and values of ${company} if possible.`,
      config: {
        systemInstruction: "You are an expert technical recruiter.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the question (e.g., q1, q2)" },
              question: { type: Type.STRING, description: "The interview question" },
              context: { type: Type.STRING, description: "Brief context on why this company asks this question" }
            },
            required: ["id", "question", "context"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  }

  async evaluateAnswers(company: string, answers: any[]) {
    const formattedAnswers = answers.map((a, i) => `
Question ${i + 1}: ${a.question}
Candidate's Answer: ${a.answer}
    `).join('\n');

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Evaluate the following HR interview answers for a candidate interviewing at ${company}.
      
      ${formattedAnswers}
      `,
      config: {
        systemInstruction: "You are an expert technical recruiter. Evaluate the candidate's answers based on the STAR method, clarity, and alignment with the company's values. Provide constructive feedback.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "The ID of the question being evaluated" },
              score: { type: Type.INTEGER, description: "Score out of 10 for the answer" },
              feedback: { type: Type.STRING, description: "Detailed constructive feedback on the answer" },
              improvement: { type: Type.STRING, description: "Specific suggestion on how to improve the answer using the STAR method or better phrasing" }
            },
            required: ["id", "score", "feedback", "improvement"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  }
}
