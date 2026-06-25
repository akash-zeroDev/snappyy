import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '../../../lib/supabaseClient';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 2. Send email via Resend
    const { data, error: resendError } = await resend.emails.send({
      from: 'MemoryPrint Feedback <onboarding@resend.dev>', // Resend testing domain
      to: ['akashkumar7653099@gmail.com'],
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
    });

    if (resendError) {
      console.error('Resend error:', resendError);
      return NextResponse.json({ error: 'Email failed: ' + resendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
