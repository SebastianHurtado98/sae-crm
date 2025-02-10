import sgMail from '@sendgrid/mail';
import { NextApiRequest, NextApiResponse } from 'next';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

type Personalization = {
  to: string
  bcc: string
  dynamicTemplateData: {
    first_name: string
    register_link: string
  }
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
          bcc: [{ email: p.bcc }],
          dynamicTemplateData: p.dynamicTemplateData,
        })),
        from: {
          email: "contactasae@apoyoconsultoria.com",
          name: "SAE | APOYO Consultoría"
        },
        templateId: template_id       
    }
  
    try {
        await sgMail.send(msg)
        res.status(200).json({ message: "Email sent successfully" })
      } catch (error) {
        console.error("Error sending email:", error)
        res.status(500).json({ message: "Error sending email" })
      }
}