import sgMail from '@sendgrid/mail';
import { NextApiRequest, NextApiResponse } from 'next';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

type Personalization = {
  to: string
}

type EmailData = {
  template_id: string
  personalizations: Personalization[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" })
    }

    const { template_id, personalizations }: EmailData = req.body
  
    const msg: sgMail.MailDataRequired = {
        personalizations: personalizations.map((p) => ({
          to: [{ email: p.to }],
        })),
        from: {
          email: "contactaaxpen@apoyoconsultoria.com",
          name: "AXPEN | APOYO Consultoría - Vinatea & Toyama"
        },
        templateId: template_id      
    }
  
    try {
        await sgMail.send(msg)
        res.status(200).json({ message: "Email sent successfully" })
      } catch (error) {
        console.error("Error sending email:", error);

        // @ts-expect-error error.response is not always defined
        if (error.response) {
          // @ts-expect-error error.response is not always defined
            console.error("SendGrid Response:", JSON.stringify(error.response.body, null, 2));
        }
        // @ts-expect-error error.response is not always defined
        res.status(500).json({ message: "Error sending email", details: error.response?.body });
      }
}