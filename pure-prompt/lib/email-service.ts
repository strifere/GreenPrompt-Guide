import { Resend } from "resend";

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

class EmailService {
  private resendClient: Resend | null = null;

  private getFromAddress(): string {
    return process.env.RESEND_FROM_EMAIL ?? "Pure Prompt <onboarding@resend.dev>";
  }

  private getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return null;
    }

    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }

    return this.resendClient;
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("Email Service (development mode)");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`\n${options.text}`);
        if (options.html) {
          console.log(`\nHTML: ${options.html}`);
        }
        console.log("---");
        return true;
      }

      const resendClient = this.getResendClient();

      if (!resendClient) {
        console.error("RESEND_API_KEY is missing. Email delivery is disabled.");
        return false;
      }

      const { error } = await resendClient.emails.send({
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (error) {
        console.error("Email send failed:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Email send failed:", error);
      return false;
    }
  }

  async sendPasswordRecoveryCode(email: string, code: string): Promise<boolean> {
    const subject = "Password Recovery Code";
    const text = `Your password recovery code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;
    const html = `<p>Your password recovery code is: <strong>${code}</strong></p><p>This code will expire in 15 minutes.</p><p>If you didn't request this, please ignore this email.</p>`;

    return this.send({
      to: email,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
