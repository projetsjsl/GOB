
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);
export async function sendEmail({ to, subject, html }:{ to: string[]; subject: string; html: string; }){
  const { data, error } = await resend.emails.send({
    from: `SACADOS Briefings <${process.env.RESEND_FROM}>`,
    to, subject, html
  });
  if (error) throw error;
  return data;
}
