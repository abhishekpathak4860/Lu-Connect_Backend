import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
// import { Express } from 'express';
// pdf-parse doesn't expose a callable default export in TS definitions;
// using require to get a function reference.
const pdfParse = require('pdf-parse');

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Parses a PDF buffer and sends the text to Google's Gemini API for analysis.
   * @param file Multer file object containing the uploaded resume
   */
  async analyseResume(file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('No resume file provided');
    }

    // pdf-parse is a function that returns an object containing text/metadata
    const textResult = await pdfParse(file.buffer as Buffer);
    // pages property might not exist depending on layout; parse text directly
    const resumeText = textResult.text || ''

    if (!resumeText || resumeText.trim() === '') {
      throw new BadRequestException('Could not extract text from the PDF');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Analyze the following resume text and extract key information.
      
      Resume Text:
      ${resumeText}
      `,
      config: {
        systemInstruction: "You are an expert technical recruiter and career coach. Analyze the resume and provide structured feedback.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
          required: ["skills", "education", "projects", "experience", "suggestedRoles", "skillsToImprove", "enhancementTips"]
        }
      }
    });

    const analysisText = response.text;
    if (!analysisText) {
      throw new InternalServerErrorException('No response from Gemini API');
    }

    const analysisResult = JSON.parse(analysisText);
    return analysisResult;
  }
}
