import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { mood, tags, message, email } = await req.json();

    // 1. Insert into Supabase
    const { error: supabaseError } = await supabase.from('feedback').insert([
      { mood, tags, message, email }
    ]);

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json({ error: 'Failed to store feedback: ' + supabaseError.message }, { status: 500 });
    }

    // 2. Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"MemoryPrint Feedback" <${process.env.GMAIL_USER}>`,
      to: ['akashkumar7653011@gmail.com', 'srivastavaalok2214@gmail.com'],
      subject: 'New Feedback Received - MemoryPrint',
      html: `
        <h2>New Feedback Submission</h2>
        <p><strong>User Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Mood:</strong> ${mood}</p>
        <p><strong>Tags:</strong> ${tags.join(', ')}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555;">
          ${message || 'No message provided'}
        </blockquote>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, data: info.messageId });
    } catch (mailError: any) {
      console.error('Nodemailer error:', mailError);
      return NextResponse.json({ error: 'Email failed: ' + mailError.message }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
