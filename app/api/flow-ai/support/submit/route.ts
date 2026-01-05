import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userEmail, 
      userName, 
      pendingId, 
      documentName, 
      message, 
      isCsv = false,
      pdfUrl,
      originalCsvData,
      processedCsvData 
    } = body;

    // Validate required fields
    if (!userEmail || !userName || !message) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { message: 'Email service is not configured' },
        { status: 500 }
      );
    }

    // Initialize Resend with API key (lazy initialization to avoid build-time errors)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Parse recipient emails (supports comma-separated list)
    const recipientEmails = process.env.RESEND_TO_EMAIL || 'ksubhan444@gmail.com';
    const toEmails = recipientEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);

    // Helper function to convert CSV data to CSV string
    const convertCsvToString = (csvData: unknown[][]): string => {
      return csvData.map(row => 
        row.map(cell => {
          const value = String(cell ?? '');
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ).join('\n');
    };

    // Helper function to fetch PDF from URL
    const fetchPdfBuffer = async (url: string): Promise<Buffer> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    };

    // Prepare attachments array
    const attachments: Array<{
      filename: string;
      content: Buffer | string;
    }> = [];

    // Add attachments based on document type
    if (isCsv) {
      // For CSV files, attach both original (before) and processed (after)
      if (originalCsvData && originalCsvData.length > 0) {
        const originalCsvString = convertCsvToString(originalCsvData);
        attachments.push({
          filename: `${documentName || 'document'}_BEFORE.csv`,
          content: Buffer.from(originalCsvString, 'utf-8'),
        });
      }

      if (processedCsvData && processedCsvData.length > 0) {
        const processedCsvString = convertCsvToString(processedCsvData);
        attachments.push({
          filename: `${documentName || 'document'}_AFTER.csv`,
          content: Buffer.from(processedCsvString, 'utf-8'),
        });
      }
    } else if (pdfUrl) {
      // For PDF files, fetch and attach the PDF
      try {
        const pdfBuffer = await fetchPdfBuffer(pdfUrl);
        attachments.push({
          filename: `${documentName || 'document'}.pdf`,
          content: pdfBuffer,
        });
      } catch (error) {
        console.error('Failed to fetch PDF for attachment:', error);
        // Continue without PDF attachment
      }
    }

    // Prepare email content
    const emailSubject = `Flow Support Request: ${documentName || 'Data Extraction Issue'}`;
    
    // Add attachment info to email body
    const attachmentInfo = attachments.length > 0 
      ? `<p><strong>Attachments:</strong> ${attachments.map(a => a.filename).join(', ')}</p>`
      : '';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Flow Support Request</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">User Information</h3>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          ${pendingId ? `<p><strong>Pending ID:</strong> ${pendingId}</p>` : ''}
          ${documentName ? `<p><strong>Document:</strong> ${documentName}</p>` : ''}
          <p><strong>Document Type:</strong> ${isCsv ? 'CSV' : 'PDF'}</p>
          ${attachmentInfo}
        </div>
        
        <div style="background-color: #fff; padding: 20px; border-left: 4px solid #0066cc; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">User's Message</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>This support request was submitted from Flow RMS AI Frontend</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    `;

    // Send email using Resend with attachments
    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      replyTo: string;
      attachments?: Array<{ filename: string; content: Buffer | string }>;
    } = {
      from: process.env.RESEND_FROM_EMAIL || 'Flow Support <onboarding@resend.dev>',
      to: toEmails,
      subject: emailSubject,
      html: emailHtml,
      replyTo: userEmail,
    };

    // Add attachments if available
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const data = await resend.emails.send(emailPayload);

    console.log('Support email sent successfully:', data);
    console.log('Attachments included:', attachments.map(a => a.filename));

    return NextResponse.json(
      { message: 'Support request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to send support email:', error);
    
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Failed to send support request',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
