import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class AiResumeAnalyzerService {
  private readonly genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  constructor(private readonly prisma: PrismaService) {}

  async analyzeResumeForJob(applicationId: string) {
   // 1. Find application with its associated job
  const application = await this.prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      resume_url: true,
      job: {
        select: {
          role: true,
          company_name: true,
          description: true,
          eligibility_criteria: true,
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  if (!application.resume_url) {
    throw new BadRequestException('Resume not found');
  }

  // 2. Download resume PDF
  let pdfBuffer: Buffer;

  try {
    const response = await fetch(application.resume_url);

    if (!response.ok) {
      throw new Error('Resume download failed');
    }

    const contentType = response.headers.get('content-type');

    if (contentType && !contentType.includes('pdf')) {
      throw new Error('Resume is not a PDF');
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      throw new Error('Resume exceeds the 5MB limit');
    }

    pdfBuffer = Buffer.from(arrayBuffer);
  } catch (error) {
    throw new BadRequestException(
      'Unable to access the candidate resume PDF',
    );
  }

// 3. Extract resume text
let resumeText: string;

try {
  const parser = new PDFParse({ data: pdfBuffer });
  const parsedPdf = await parser.getText();

  resumeText = parsedPdf.text?.trim() ?? '';

  if (!resumeText) {
    throw new Error('No readable text found');
  }

  await parser.destroy();
} catch (error) {
  throw new BadRequestException(
    'Unable to extract readable text from the resume',
  );
}

  // 4. Prepare job requirements
  const job = application.job;

  const prompt = `
You are an AI resume screening assistant helping a university placement team.

Compare the candidate's resume against the following job requirements.

JOB ROLE:
${job.role}

COMPANY:
${job.company_name}

JOB DESCRIPTION:
${job.description}

ELIGIBILITY CRITERIA:
${job.eligibility_criteria}

CANDIDATE RESUME:
${resumeText}

Evaluate only the candidate's demonstrated qualifications and their relevance
to the job. Do not infer skills or experience that are not present.

Return exactly one of these three labels:
GREAT_FIT
POTENTIAL_FIT
NOT_A_FIT

Guidelines:
- GREAT_FIT: Strong evidence that the candidate meets the important job requirements.
- POTENTIAL_FIT: Some relevant qualifications, but important requirements are missing or unclear.
- NOT_A_FIT: Little relevant evidence that the candidate meets the important job requirements.

Return only the label. Do not include explanations or any additional text.
`;

  // 5. Ask Gemini for its recommendation
  try {
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const recommendation = result.text?.trim().toUpperCase();

    const allowedResults = [
      'GREAT_FIT',
      'POTENTIAL_FIT',
      'NOT_A_FIT',
    ];

    if (!recommendation || !allowedResults.includes(recommendation)) {
      throw new Error('Invalid AI response');
    }

    return {
      success: true,
      recommendation,
    };
  } catch (error) {
    console.error('AI resume analysis failed:', error);

    throw new InternalServerErrorException(
      'AI resume analysis failed. Please try again.',
    );
  }
  }
}