// Declaração de tipo básica para nodemailer
declare module 'nodemailer' {
  export interface MailOptions {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<any>;
  }

  export function createTransport(options: any): Transporter;
}

export default nodemailer; 