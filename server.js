require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

app.post('/api/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const entry = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    service: service || 'Not specified',
    message: message.trim(),
    date: new Date().toISOString(),
  };

  // Save to contacts.json as backup
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const contactsPath = path.join(dataDir, 'contacts.json');
  let contacts = [];
  try {
    if (fs.existsSync(contactsPath)) {
      contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
    }
  } catch { contacts = []; }
  contacts.push(entry);
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));

  // Send email
  try {
    await transporter.sendMail({
      from: `"The Cleanup Crew Website" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: entry.email,
      subject: `New Enquiry from ${entry.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #0D1B3E; margin-bottom: 24px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #5A6A8A; font-size: 14px; width: 110px;">Name</td>
              <td style="padding: 10px 0; color: #0D1B3E; font-weight: 600;">${entry.name}</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #5A6A8A; font-size: 14px;">Email</td>
              <td style="padding: 10px 0;"><a href="mailto:${entry.email}" style="color: #51BFFF;">${entry.email}</a></td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #5A6A8A; font-size: 14px;">Service</td>
              <td style="padding: 10px 0; color: #0D1B3E;">${entry.service}</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #5A6A8A; font-size: 14px; vertical-align: top;">Message</td>
              <td style="padding: 10px 0; color: #0D1B3E; line-height: 1.6;">${entry.message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 12px; color: #9AAAC2;">Sent ${new Date().toLocaleString('en-GB')} · The Cleanup Crew website</p>
        </div>
      `,
    });

    console.log(`[Contact] Email sent from ${entry.email}`);
    res.json({ success: true, message: "Thanks! We'll be in touch within 24 hours." });

  } catch (err) {
    console.error('[Contact] Email failed:', err.message);
    // Still return success since we saved to file — don't expose the error to the user
    res.json({ success: true, message: "Thanks! We'll be in touch within 24 hours." });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local dev
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`The Cleanup Crew → http://localhost:${PORT}`);
  });
}

// Vercel serverless export
module.exports = app;
