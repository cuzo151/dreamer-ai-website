// Nodemailer import - wrapped to handle missing dependency
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.log('Nodemailer not available, using console logging for emails');
}

// Create transporter based on environment
const createTransporter = () => {
  // For now, just log emails in both development and production
  // since email service isn't configured
  return {
    sendMail: async (options) => {
      console.log('📧 Email notification:');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.html || options.text);
      return { messageId: `email-${Date.now()}` };
    }
  };
};

const transporter = createTransporter();

// Email templates
const templates = {
  'verify-email': (data) => ({
    subject: 'Verify your Dreamer AI account',
    html: `
      <h2>Welcome to Dreamer AI, ${data.name}!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${data.verificationLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #3b82f6;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        margin: 16px 0;
      ">Verify Email</a>
      <p>Or copy and paste this link: ${data.verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The Dreamer AI Team</p>
    `
  }),
  
  'reset-password': (data) => ({
    subject: 'Reset your Dreamer AI password',
    html: `
      <h2>Hello ${data.name},</h2>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <a href="${data.resetLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #3b82f6;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        margin: 16px 0;
      ">Reset Password</a>
      <p>Or copy and paste this link: ${data.resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Dreamer AI Team</p>
    `
  }),
  
  'booking-confirmation': (data) => ({
    subject: 'Booking Confirmation - Dreamer AI',
    html: `
      <h2>Booking Confirmed!</h2>
      <p>Hello ${data.name},</p>
      <p>Your consultation has been confirmed for:</p>
      <div style="
        background-color: #f3f4f6;
        padding: 16px;
        border-radius: 8px;
        margin: 16px 0;
      ">
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Duration:</strong> ${data.duration}</p>
      </div>
      <p>We'll send you a reminder 24 hours before your appointment.</p>
      <p>Need to reschedule? <a href="${data.rescheduleLink}">Click here</a></p>
      <p>Best regards,<br>The Dreamer AI Team</p>
    `
  })
};

// Send email function
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    let emailContent = {};
    
    emailContent = template && templates[template] ? templates[template](data) : { subject, html, text };
    
    const mailOptions = {
      from: `"Dreamer AI Solutions" <${process.env.EMAIL_FROM || 'noreply@dreamer-ai.com'}>`,
      to,
      subject: emailContent.subject || subject,
      html: emailContent.html || html,
      text: emailContent.text || text
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Bulk email sender with rate limiting
const sendBulkEmails = async (recipients, emailOptions) => {
  const results = [];
  const batchSize = 10;
  const delayMs = 1000;
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(recipient => 
      sendEmail({ ...emailOptions, to: recipient })
        .then(result => ({ success: true, recipient, result }))
        .catch(error => ({ success: false, recipient, error }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails
};