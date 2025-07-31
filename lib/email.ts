/**
 * Email Notification System
 * Handles sending emails for feedback and issue notifications
 */

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private static instance: EmailService
  private transporter: any = null

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async initialize(): Promise<void> {
    try {
      // This will be implemented once nodemailer is installed
      console.log('Email service initialization placeholder - install nodemailer package first')
      
      // const nodemailer = require('nodemailer')
      // const config: EmailConfig = {
      //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
      //   port: parseInt(process.env.SMTP_PORT || '587'),
      //   secure: false,
      //   auth: {
      //     user: process.env.SMTP_USER || '',
      //     pass: process.env.SMTP_PASS || ''
      //   }
      // }
      // 
      // this.transporter = nodemailer.createTransporter(config)
      // await this.transporter.verify()
      
    } catch (error) {
      console.error('Email service initialization error:', error)
      throw error
    }
  }

  async sendFeedbackNotification(feedback: {
    type: string
    subject: string
    message: string
    rating: number
    email: string
    userRole: string
  }): Promise<void> {
    const template = this.generateFeedbackTemplate(feedback)
    await this.sendEmail(template)
  }

  async sendIssueNotification(issue: {
    issueId: string
    type: string
    priority: string
    title: string
    description: string
    email: string
    userRole: string
    environment?: any
  }): Promise<void> {
    const template = this.generateIssueTemplate(issue)
    await this.sendEmail(template)
  }

  private generateFeedbackTemplate(feedback: any): EmailTemplate {
    const priorityColor = feedback.rating >= 4 ? '#22c55e' : feedback.rating >= 3 ? '#f59e0b' : '#ef4444'
    
    return {
      to: process.env.COMPANY_EMAIL || 'feedback@yourcompany.com',
      subject: `Nuevos Comentarios: ${feedback.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Nuevos Comentarios Recibidos</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tipo:</strong> ${feedback.type}</p>
            <p><strong>Asunto:</strong> ${feedback.subject}</p>
            <p><strong>Calificación:</strong> 
              <span style="color: ${priorityColor};">
                ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)} (${feedback.rating}/5)
              </span>
            </p>
            <p><strong>Usuario:</strong> ${feedback.email} (${feedback.userRole})</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0;">Mensaje:</h3>
            <p style="white-space: pre-wrap;">${feedback.message}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Estos comentarios fueron enviados a través del sistema de comentarios del WareHouse ACS Logística.
          </p>
        </div>
      `,
      text: `
Nuevos Comentarios Recibidos

Tipo: ${feedback.type}
Asunto: ${feedback.subject}
Calificación: ${feedback.rating}/5
Usuario: ${feedback.email} (${feedback.userRole})

Mensaje:
${feedback.message}
      `
    }
  }

  private generateIssueTemplate(issue: any): EmailTemplate {
    const priorityColors: Record<string, string> = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    }

    const priorityColor = priorityColors[issue.priority] || '#6b7280'
    
    return {
      to: process.env.COMPANY_EMAIL || 'issues@yourcompany.com',
      subject: `[${issue.priority.toUpperCase()}] Incidencia #${issue.issueId}: ${issue.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Nuevo Reporte de Incidencia</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID de Incidencia:</strong> ${issue.issueId}</p>
            <p><strong>Tipo:</strong> ${issue.type}</p>
            <p><strong>Prioridad:</strong> 
              <span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${issue.priority.toUpperCase()}
              </span>
            </p>
            <p><strong>Título:</strong> ${issue.title}</p>
            <p><strong>Reportado por:</strong> ${issue.email} (${issue.userRole})</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">Descripción:</h3>
            <p style="white-space: pre-wrap;">${issue.description}</p>
          </div>
          
          ${issue.environment ? `
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #374151;">Información del Entorno:</h4>
            <pre style="font-size: 12px; overflow-x: auto;">${JSON.stringify(issue.environment, null, 2)}</pre>
          </div>
          ` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Esta incidencia fue reportada a través del sistema de seguimiento de incidencias del WareHouse ACS Logística.
          </p>
        </div>
      `,
      text: `
Nuevo Reporte de Incidencia

ID de Incidencia: ${issue.issueId}
Tipo: ${issue.type}
Prioridad: ${issue.priority}
Título: ${issue.title}
Reportado por: ${issue.email} (${issue.userRole})

Descripción:
${issue.description}

Entorno: ${issue.environment ? JSON.stringify(issue.environment, null, 2) : 'No proporcionado'}
      `
    }
  }

  private async sendEmail(template: EmailTemplate): Promise<void> {
    try {
      // Placeholder for actual email sending
      console.log('Sending email (placeholder):', {
        to: template.to,
        subject: template.subject,
        textLength: template.text?.length || 0,
        htmlLength: template.html.length
      })

      // Real implementation:
      // if (!this.transporter) {
      //   await this.initialize()
      // }
      // 
      // const result = await this.transporter.sendMail({
      //   from: process.env.SMTP_USER,
      //   to: template.to,
      //   subject: template.subject,
      //   text: template.text,
      //   html: template.html
      // })
      // 
      // console.log('Email sent successfully:', result.messageId)

    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }
}

export const emailService = EmailService.getInstance()