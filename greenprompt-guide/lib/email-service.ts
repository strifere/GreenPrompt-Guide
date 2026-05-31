import nodemailer from "nodemailer";

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

class EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 465),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  private getFromAddress(): string {
    return process.env.EMAIL_FROM ?? "GreenPrompt Guide <greenprompt.guide@gmail.com>";
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

      const result = await this.transporter.sendMail({
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return Boolean(result.messageId);
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

  async sendSignupVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = "Verify Your GreenPrompt Guide Email";
    const text = `Your email verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;
    const html = `<p>Your email verification code is: <strong>${code}</strong></p><p>This code will expire in 15 minutes.</p><p>If you didn't request this, please ignore this email.</p>`;

    return this.send({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendEmailChangeVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = "Email Change Verification Code";
    const text = `Your email change verification code is: ${code}\n\nThis code will expire in 15 minutes.`;
    const html = `<p>Your email change verification code is: <strong>${code}</strong></p><p>This code will expire in 15 minutes.</p>`;

    return this.send({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendUserDeletionNotice(email: string, reason: string): Promise<boolean> {
    const subject = "Your GreenPrompt Guide account has been deleted";
    const text = `Your account has been deleted by an administrator.\n\nReason: ${reason}`;
    const html = `<p>Your account has been deleted by an administrator.</p><p><strong>Reason:</strong> ${reason}</p>`;

    return this.send({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendUserBanNotice(email: string, reason: string): Promise<boolean> {
    const subject = "Your GreenPrompt Guide account has been banned";
    const text = `Your account has been banned by an administrator.\n\nReason: ${reason}`;
    const html = `<p>Your account has been banned by an administrator.</p><p><strong>Reason:</strong> ${reason}</p>`;

    return this.send({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendUserUnbanNotice(email: string): Promise<boolean> {
    const subject = "Your GreenPrompt Guide account has been restored";
    const text = "Your account has been unbanned by an administrator and your access has been restored.";
    const html = `<p>Your account has been unbanned by an administrator and your access has been restored.</p>`;

    return this.send({
      to: email,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
