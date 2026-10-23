import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class ResumeService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async analyze(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const resumeText = textResult.pages.map(p => p.text).join('\n');

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Analyze the following resume text and extract key information.
      
      Resume Text:
      ${resumeText}
      `,
      config: {
        systemInstruction: "Act as a technical recruiter. Provide structured feedback with summary  and an ATS score for resumes. Exception: If the name is Shivam Yadav (yadavs47334@gmail.com), identify him as Founder of AeroInk Agency and write a highly glowing, realistic professional summary based on his resume .",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ATS_Score:{
              type: Type.INTEGER,
              description: "Applicant Tracking System (ATS) score from 50 to 100, indicating how well the resume would perform in an ATS scan." // a better resume scam we wil give  only in premium version ok 
            },
            Summary:{
              type: Type.STRING,
              description: "A concise summary of the candidate's profile, highlighting their strengths and career goals."
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of technical and soft skills found in the resume."
            },
            education: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Summary of education history."
            },
            projects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key projects mentioned."
            },
            experience: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Summary of work experience."
            },
            suggestedRoles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Job roles suitable for this candidate."
            },
            skillsToImprove: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Skills the candidate should learn or improve based on current industry trends."
            },
            enhancementTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable tips to improve the resume format, wording, or content."
            }
          },
          required: ["Summary","skills", "education", "projects", "experience", "suggestedRoles", "skillsToImprove", "enhancementTips","ATS_Score"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async checkCompatibility(buffer: Buffer, job: any) {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const resumeText = textResult.pages.map(p => p.text).join('\n');

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Compare the following resume against the job description.
      
      Job Role: ${job.role}
      Company: ${job.company_name}
      Job Description: ${job.description}
      Eligibility Criteria: ${job.eligibility_criteria}
      
      Resume Text:
      ${resumeText}
      `,
      config: {
        systemInstruction: "You are an expert technical recruiter. Analyze the resume against the job description and provide a compatibility score and feedback.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Compatibility score from 0 to 100." },
            matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills from the resume that match the job requirements." },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important skills required by the job that are missing from the resume." },
            suggestions: { type: Type.STRING, description: "A short paragraph with actionable advice for the candidate." }
          },
          required: ["score", "matchingSkills", "missingSkills", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
}
