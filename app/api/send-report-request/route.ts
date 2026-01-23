import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const message = formData.get('message');
    const accessToken = formData.get('accessToken');
    const files = formData.getAll('files');

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required message' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const recipientEmails = process.env.RESEND_TO_EMAIL || 'ksubhan444@gmail.com';
    const toEmails = recipientEmails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const attachments: Array<{ filename: string; content: Buffer }> = [];
    for (const file of files) {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name || 'attachment',
          content: buffer,
        });
      }
    }

    const attachmentInfo = attachments.length
      ? `<p><strong>Attachments:</strong> ${attachments.map((a) => a.filename).join(', ')}</p>`
      : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Flow Report Request</h2>
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${attachmentInfo}
          ${accessToken && typeof accessToken === 'string' ? `<p><strong>Access Token:</strong> ${accessToken}</p>` : ''}
        </div>
        <div style="background-color: #fff; padding: 16px; border-left: 4px solid #2563eb; margin: 16px 0;">
          <h3 style="color: #666; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <div style="color: #999; font-size: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #ddd;">
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    `;

    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer }>;
    } = {
      from: process.env.RESEND_FROM_EMAIL || 'Flow Support <onboarding@resend.dev>',
      to: toEmails,
      subject: 'Flow Report Request',
      html: emailHtml,
    };

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const data = await resend.emails.send(emailPayload);
    console.log('Report request email sent:', data);

    return NextResponse.json({ message: 'Request sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to send report request:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send report request',
      },
      { status: 500 }
    );
  }
}
