import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const SUPPORT_EMAIL = 'support-team-tasks-e200c9ebc367@intake.linear.app';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const ticketType = formData.get('ticketType') as string;
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;
    const userName = formData.get('userName') as string;
    const userEmail = formData.get('userEmail') as string;
    const tenancyName = formData.get('tenancyName') as string;
    const logRocketUrl = formData.get('logRocketUrl') as string | null;

    // Validate required fields
    if (!ticketType || !title || !message) {
      return NextResponse.json(
        { message: 'Missing required fields: ticketType, title, and message are required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { message: 'Email service is not configured. Please add RESEND_API_KEY to your environment.' },
        { status: 500 }
      );
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Process file attachments
    const attachments: Array<{ filename: string; content: Buffer }> = [];

    for (let i = 0; i < 5; i++) {
      const file = formData.get(`attachment_${i}`) as File | null;
      if (file && file.size > 0) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          attachments.push({
            filename: file.name,
            content: Buffer.from(arrayBuffer),
          });
        } catch (error) {
          console.error(`Failed to process attachment ${i}:`, error);
        }
      }
    }

    // Format ticket type for display
    const ticketTypeDisplay = ticketType === 'technical' ? 'Technical Issue' : 'General Inquiry';
    const priorityEmoji = ticketType === 'technical' ? '🔴' : '🔵';

    // Build email subject for Linear
    const emailSubject = `[${ticketTypeDisplay}] ${title}`;

    // Build the email HTML body
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1d29; max-width: 640px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #5048E6 0%, #6B63EA 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
      ${priorityEmoji} FlowCRM Support Ticket
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
      ${ticketTypeDisplay}
    </p>
  </div>

  <!-- User Info Card -->
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
    <table style="width: 100%;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 8px 0;">
          <span style="color: #6b7280; font-size: 13px;">Submitted by</span><br>
          <strong style="color: #1a1d29; font-size: 15px;">${userName || 'Unknown User'}</strong>
        </td>
        <td style="padding: 8px 0; text-align: right;">
          <span style="color: #6b7280; font-size: 13px;">Organization</span><br>
          <strong style="color: #1a1d29; font-size: 15px;">${tenancyName || 'Unknown'}</strong>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 8px 0;">
          <span style="color: #6b7280; font-size: 13px;">Email</span><br>
          <a href="mailto:${userEmail}" style="color: #5048E6; font-size: 15px; text-decoration: none;">${userEmail || 'No email provided'}</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- Title Section -->
  <div style="background-color: #ffffff; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
    <h2 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
      Title
    </h2>
    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1d29;">
      ${title}
    </p>
  </div>

  <!-- Message Section -->
  <div style="background-color: #ffffff; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-top: 1px solid #f3f4f6;">
    <h2 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
      ${ticketType === 'technical' ? 'Issue Details' : 'Message'}
    </h2>
    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid ${ticketType === 'technical' ? '#f59e0b' : '#5048E6'};">
      <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #374151;">
${message}
      </p>
    </div>
  </div>

  ${logRocketUrl ? `
  <!-- LogRocket Session -->
  <div style="background-color: #fef3c7; padding: 16px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-top: 1px solid #fde68a;">
    <h2 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
      🎥 Session Replay Available
    </h2>
    <a href="${logRocketUrl}" style="color: #5048E6; font-size: 14px; word-break: break-all;">
      ${logRocketUrl}
    </a>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #92400e;">
      Click above to watch the user's session and see exactly what happened.
    </p>
  </div>
  ` : ''}

  ${attachments.length > 0 ? `
  <!-- Attachments Section -->
  <div style="background-color: #ffffff; padding: 16px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-top: 1px solid #f3f4f6;">
    <h2 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
      📎 Attachments (${attachments.length})
    </h2>
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      ${attachments.map(a => a.filename).join(', ')}
    </p>
  </div>
  ` : ''}

  <!-- Footer -->
  <div style="background-color: #f3f4f6; padding: 16px 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
      Submitted via FlowChat • ${new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}
    </p>
  </div>

</body>
</html>
    `.trim();

    // Prepare email payload
    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      replyTo?: string;
      attachments?: Array<{ filename: string; content: Buffer }>;
    } = {
      from: process.env.RESEND_FROM_EMAIL || 'FlowCRM Support <support@flowrms.com>',
      to: [SUPPORT_EMAIL],
      subject: emailSubject,
      html: emailHtml,
    };

    // Add reply-to if user has email
    if (userEmail && userEmail !== 'No email provided') {
      emailPayload.replyTo = userEmail;
    }

    // Add attachments if any
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    // Send email to Linear
    const linearResult = await resend.emails.send(emailPayload);
    console.log('Support ticket sent to Linear:', linearResult);

    // Send to Teams webhook if configured
    if (process.env.TEAMS_SUPPORT_WEBHOOK_URL) {
      try {
        await sendTeamsNotification({
          ticketType,
          title,
          userName,
          userEmail,
          tenancyName,
          message,
          logRocketUrl,
          attachmentCount: attachments.length,
        });
        console.log('Teams notification sent successfully');
      } catch (teamsError) {
        console.error('Failed to send Teams notification:', teamsError);
        // Don't fail the whole request if Teams fails
      }
    }

    return NextResponse.json(
      { message: 'Support ticket submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to submit support ticket:', error);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to submit support ticket',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

// Send notification to Microsoft Teams channel
async function sendTeamsNotification(data: {
  ticketType: string;
  title: string;
  userName: string;
  userEmail: string;
  tenancyName: string;
  message: string;
  logRocketUrl: string | null;
  attachmentCount: number;
}) {
  const webhookUrl = process.env.TEAMS_SUPPORT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const isTehnical = data.ticketType === 'technical';
  const themeColor = isTehnical ? 'F59E0B' : '5048E6';
  const typeEmoji = isTehnical ? '🔴' : '🔵';
  const typeLabel = isTehnical ? 'Technical Issue' : 'General Inquiry';

  // Build Teams Adaptive Card message
  const teamsMessage = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor,
    summary: `New Support Ticket: ${data.title}`,
    sections: [
      {
        activityTitle: `${typeEmoji} **${data.title}**`,
        activitySubtitle: `${typeLabel} from **${data.userName}** (${data.tenancyName})`,
        facts: [
          { name: 'Email', value: data.userEmail },
          { name: 'Organization', value: data.tenancyName },
          ...(data.attachmentCount > 0 ? [{ name: 'Attachments', value: `${data.attachmentCount} file(s)` }] : []),
        ],
        text: data.message.length > 500 ? data.message.substring(0, 500) + '...' : data.message,
        markdown: true,
      },
    ],
    potentialAction: [
      ...(data.logRocketUrl ? [{
        '@type': 'OpenUri',
        name: 'View Session Replay',
        targets: [{ os: 'default', uri: data.logRocketUrl }],
      }] : []),
      {
        '@type': 'OpenUri',
        name: 'View in Linear',
        targets: [{ os: 'default', uri: 'https://linear.app/flowrms/inbox' }],
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teamsMessage),
  });
}
