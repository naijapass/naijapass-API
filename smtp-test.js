const nodemailer = require('nodemailer');

// === Configure transporter ===
const transporter = nodemailer.createTransport({
  host: 'mail.maje.com.ng',
  port: 465, // SSL
  secure: true, // true for port 465
  auth: {
    user: 'noreply@maje.com.ng',
    pass: 'Maje@2025', // <-- put actual password
  },
  tls: {
    rejectUnauthorized: false,
  },
  logger: true,
  debug: true,
});

// === Test sending ===
(async () => {
  try {
    const info = await transporter.sendMail({
      from: 'noreply@maje.com.ng',
      to: 'majeapplication@gmail.com', // replace with your email
      subject: 'SMTP Test from Node.js',
      text: 'Hello, this is a test email from maje.com.ng SMTP server.',
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed to send:', error);
  }
})();
