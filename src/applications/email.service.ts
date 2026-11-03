
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT') || 587),
      secure:
        this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendShortlistEmail(applicationId: string) {
    // Fetch application and associated job using job_id relation.
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        name: true,
        email: true,
        job: {
          select: {
            company_name: true,
            role: true,
            package: true,
            location: true,
          },
        },
      },
    });

    if (!application) {
      throw new InternalServerErrorException(
        'Application not found for shortlist email',
      );
    }

    const { name, email, job } = application;

    const fromName =
      this.configService.get<string>('SMTP_FROM_NAME') ||
      'LU Connect Placement Team';

    const fromEmail =
      this.configService.get<string>('SMTP_FROM_EMAIL');

    if (!fromEmail || !email) {
      throw new InternalServerErrorException(
        'Sender or recipient email is missing',
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background-color:#f4f6fb;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
                
                <tr>
                  <td style="padding:28px 32px;background:#1e40af;color:#ffffff;">
                    <h1 style="margin:0;font-size:25px;letter-spacing:1px;">LU.CONNECT</h1>
                    <p style="margin:8px 0 0;font-size:13px;color:#dbeafe;">Career & Placement Portal</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px 20px;">
                    <p style="margin:0 0 12px;color:#16a34a;font-size:13px;font-weight:bold;letter-spacing:1px;">
                      APPLICATION UPDATE
                    </p>

                    <h2 style="margin:0 0 18px;font-size:26px;line-height:1.3;color:#111827;">
                      Congratulations, ${this.escapeHtml(name)}!
                    </h2>

                    <p style="margin:0;font-size:15px;line-height:1.8;color:#4b5563;">
                      We are delighted to inform you that your application has been
                      <strong style="color:#15803d;">shortlisted</strong> for the following opportunity.
                      Congratulations on reaching this stage!
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 32px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
                      <tr>
                        <td style="padding:22px;">
                          <p style="margin:0 0 18px;font-size:12px;font-weight:bold;color:#6b7280;letter-spacing:1px;">
                            JOB DETAILS
                          </p>

                          <p style="margin:0 0 5px;font-size:12px;color:#6b7280;">Company</p>
                          <p style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#111827;">
                            ${this.escapeHtml(job.company_name)}
                          </p>

                          <p style="margin:0 0 5px;font-size:12px;color:#6b7280;">Position</p>
                          <p style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#111827;">
                            ${this.escapeHtml(job.role)}
                          </p>

                          <p style="margin:0 0 5px;font-size:12px;color:#6b7280;">Package</p>
                          <p style="margin:0 0 16px;font-size:15px;color:#111827;">
                            ${this.escapeHtml(job.package)}
                          </p>

                          <p style="margin:0 0 5px;font-size:12px;color:#6b7280;">Location</p>
                          <p style="margin:0;font-size:15px;color:#111827;">
                            ${this.escapeHtml(job.location)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 32px;">
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#4b5563;">
                      Please keep an eye on your registered email and LU Connect dashboard
                      for further updates regarding the selection process.
                    </p>

                    <p style="margin:0;font-size:14px;line-height:1.8;color:#4b5563;">
                      We wish you the very best for the next stages!
                    </p>

                    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#374151;">
                      Regards,<br />
                      <strong>LU Connect Placement Team</strong><br />
                      University of Lucknow
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
                      This is an automated notification from LU Connect.<br />
                      Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: {
          name: fromName,
          address: fromEmail,
        },
        to: email,
        subject: `Congratulations! You've been shortlisted for ${job.role}`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Shortlist email sending failed:', error);
      throw error;
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });
  }
}
