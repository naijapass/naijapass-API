export const ORGANIZER_WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to NaijaPass — Start Creating Amazing Events</title>
  <style>
    html,body{margin:0;padding:0;background:#f5f7fb;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0f1724}
    .wrap{max-width:680px;margin:28px auto;padding:0}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06)}
    .banner{background:linear-gradient(135deg, #023020 0%, #034f30 50%, #023020 100%);padding:32px 24px;text-align:center}
    .brand{font-weight:800;color:#fff;font-size:28px;margin:0 0 8px;letter-spacing:-0.5px}
    .brand span{color:#FFD700}
    .tagline{color:rgba(255,255,255,0.9);font-size:14px;margin:0}
    .body{padding:32px}
    .greeting{margin:0 0 12px;font-size:16px}
    .lead{margin:0 0 24px;color:#374151;line-height:1.5;font-size:15px}
    .feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:24px 0}
    .feature-card{background:#f8fafc;border-radius:12px;padding:16px;text-align:center}
    .feature-icon{font-size:32px;margin-bottom:8px;display:inline-block}
    .feature-title{font-weight:700;color:#0f1724;margin:8px 0 4px;font-size:14px}
    .feature-desc{color:#64748b;font-size:12px;line-height:1.4}
    .cta{text-align:center;margin:28px 0 20px}
    .btn{display:inline-block;background:#023020;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;transition:background 0.2s}
    .btn:hover{background:#034f30}
    .divider{border-top:1px solid #eef2f7;margin:24px 0}
    .small-text{font-size:13px;color:#6b7280;line-height:1.5}
    .footer{padding:20px 24px;background:#fbfdff;border-top:1px solid #eef2f7;text-align:center;color:#64748b;font-size:13px}
    @media (max-width:480px){
      .body{padding:20px}
      .banner{padding:24px 16px}
      .brand{font-size:22px}
      .feature-grid{grid-template-columns:1fr}
    }
  </style>
</head>
<body>
  <div class="wrap" role="article" aria-label="Welcome to NaijaPass Organizer Portal">
    <div class="card">
      <div class="banner" role="banner">
        <h1 class="brand">🇳🇬 Naija<span>Pass</span></h1>
        <p class="tagline">Organizer Portal — Create, Manage, Grow</p>
      </div>

      <div class="body">
        <p class="greeting">Hi {name},</p>

        <p class="lead">
          Welcome to <strong>NaijaPass Organizer Portal</strong>! You're now part of a platform that helps you create, manage, and sell tickets for amazing events across Nigeria. 
          We're excited to help you bring your events to life and reach thousands of attendees.
        </p>

        <div style="background:#E8F5E9;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
          <p style="margin:0 0 12px;font-weight:700;color:#023020">🎉 Ready to create your first event?</p>
          <p style="margin:0;font-size:14px;color:#374151">Start selling tickets in minutes and reach thousands of event-goers across Nigeria.</p>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <span class="feature-icon">📝</span>
            <div class="feature-title">Easy Event Creation</div>
            <div class="feature-desc">Create events in minutes with our simple form</div>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🎫</span>
            <div class="feature-title">Ticket Management</div>
            <div class="feature-desc">Create multiple ticket tiers and track sales</div>
          </div>
          <div class="feature-card">
            <span class="feature-icon">📊</span>
            <div class="feature-title">Real-time Analytics</div>
            <div class="feature-desc">Track ticket sales, revenue, and attendee data</div>
          </div>
          <div class="feature-card">
            <span class="feature-icon">💰</span>
            <div class="feature-title">Fast Payouts</div>
            <div class="feature-desc">Get your earnings quickly and securely</div>
          </div>
        </div>

        <div class="cta">
          <a href="{dashboardUrl}" class="btn">Go to Dashboard →</a>
        </div>

        <div class="divider"></div>

        <div class="small-text">
          <p style="margin:0 0 12px"><strong>✨ What you can do as an organizer:</strong></p>
          <ul style="margin:0;padding-left:20px;color:#6b7280">
            <li style="margin:6px 0">🎪 Create and publish unlimited events</li>
            <li style="margin:6px 0">🎟️ Set up multiple ticket types and pricing</li>
            <li style="margin:6px 0">📈 Track ticket sales and revenue in real-time</li>
            <li style="margin:6px 0">👥 Manage attendees and check-ins</li>
            <li style="margin:6px 0">💸 Request payouts directly to your bank account</li>
            <li style="margin:6px 0">📧 Promote your events to thousands of users</li>
          </ul>
        </div>

        <div class="small-text" style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px">
          <p style="margin:0 0 8px"><strong>📞 Need help getting started?</strong></p>
          <p style="margin:0">Contact our organizer support team at <a href="mailto:organizers@naijapass.com" style="color:#023020;text-decoration:underline">organizers@naijapass.com</a></p>
        </div>
      </div>

      <div class="footer" role="contentinfo">
        <p style="margin:0 0 8px">© {year} NaijaPass. All rights reserved.</p>
        <p style="margin:0;font-size:12px;color:#94a3b8">Empowering event creators across Nigeria</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

export const ORGANIZER_MAGIC_LINK_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NaijaPass Organizer — Reset Your Password</title>
  <style>
    html,body{margin:0;padding:0;background:#f5f7fb;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0f1724}
    .wrap{max-width:680px;margin:28px auto;padding:0}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06)}
    .banner{background:linear-gradient(135deg, #023020 0%, #034f30 50%, #023020 100%);padding:32px 24px;text-align:center}
    .brand{font-weight:800;color:#fff;font-size:28px;margin:0}
    .brand span{color:#FFD700}
    .body{padding:32px}
    .greeting{margin:0 0 12px;font-size:16px}
    .lead{margin:0 0 24px;color:#374151;line-height:1.5;font-size:15px}
    .cta{text-align:center;margin:28px 0}
    .btn{display:inline-block;background:#023020;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px}
    .btn:hover{background:#034f30}
    .small-text{font-size:13px;color:#6b7280;line-height:1.5}
    .footer{padding:20px 24px;background:#fbfdff;border-top:1px solid #eef2f7;text-align:center;color:#64748b;font-size:13px}
    @media (max-width:480px){
      .body{padding:20px}
      .banner{padding:24px 16px}
      .brand{font-size:22px}
    }
  </style>
</head>
<body>
  <div class="wrap" role="article" aria-label="Reset Your NaijaPass Organizer Password">
    <div class="card">
      <div class="banner" role="banner">
        <h1 class="brand">🇳🇬 Naija<span>Pass</span></h1>
      </div>

      <div class="body">
        <p class="greeting">Hi {name},</p>

        <p class="lead">
          We received a request to reset your password for your <strong>NaijaPass Organizer</strong> account. 
          Click the button below to create a new password.
        </p>

        <div class="cta">
          <a href="{magicLink}" class="btn">Reset Password →</a>
        </div>

        <p class="small-text">
          This link will expire in <strong>{expiryMinutes} minutes</strong>. If you didn't request this, please ignore this email.
        </p>

        <div class="small-text" style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px">
          <p style="margin:0">Link not working? Copy and paste this URL into your browser:</p>
          <p style="margin:8px 0 0;word-break:break-all;color:#023020;font-size:12px">{magicLink}</p>
        </div>

        <p class="small-text" style="margin-top:20px">
          Need help? Contact us at <a href="mailto:organizers@naijapass.com" style="color:#023020;text-decoration:underline">organizers@naijapass.com</a>
        </p>
      </div>

      <div class="footer" role="contentinfo">
        <p style="margin:0">© {year} NaijaPass. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

export const TICKET_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Ticket - {eventTitle} | NaijaPass</title>
  <style>
    html,body{margin:0;padding:0;background:#f5f7fb;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0f1724}
    .wrap{max-width:680px;margin:28px auto;padding:0}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06)}
    .banner{background:linear-gradient(135deg, #023020 0%, #034f30 50%, #023020 100%);padding:32px 24px;text-align:center}
    .brand{font-weight:800;color:#fff;font-size:28px;margin:0}
    .brand span{color:#FFD700}
    .event-image{width:100%;height:200px;object-fit:cover}
    .body{padding:32px}
    .event-title{font-size:24px;font-weight:800;color:#023020;margin:0 0 8px}
    .event-category{display:inline-block;background:#023020/10;color:#023020;padding:4px 12px;border-radius:20px;font-size:12px;margin-bottom:20px}
    .ticket-card{background:#f8fafc;border-radius:16px;padding:24px;margin:24px 0;border:2px solid #e2e8f0}
    .info-row{display:flex;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
    .info-label{width:110px;font-weight:700;color:#475569}
    .info-value{flex:1;color:#1e293b}
    .qr-code{text-align:center;margin:24px 0;padding:20px;background:white;border-radius:12px}
    .qr-code img{max-width:180px;height:auto;margin:0 auto}
    .ticket-code{text-align:center;font-family:monospace;font-size:14px;background:#f1f5f9;padding:8px;border-radius:8px;margin:12px 0}
    .checkin-note{background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:24px 0}
    .checkin-note p{margin:0;color:#92400e;font-size:14px}
    .footer{padding:20px 24px;background:#fbfdff;border-top:1px solid #eef2f7;text-align:center;color:#64748b;font-size:13px}
    .btn{display:inline-block;background:#023020;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;margin-top:16px}
    @media (max-width:480px){
      .body{padding:20px}
      .info-row{flex-direction:column}
      .info-label{margin-bottom:4px}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="banner">
        <h1 class="brand">🇳🇬 Naija<span>Pass</span></h1>
      </div>

      {eventImage}

      <div class="body">
        <p style="font-size:16px;margin:0 0 8px">Dear <strong>{buyerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#475569">Thank you for your purchase! Here is your ticket for <strong>{eventTitle}</strong>.</p>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">🎟️ Event Details</h2>
          
          <div class="info-row">
            <div class="info-label">Event:</div>
            <div class="info-value">{eventTitle}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Category:</div>
            <div class="info-value">{eventCategory}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date & Time:</div>
            <div class="info-value">{eventDate} at {eventTime}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Venue:</div>
            <div class="info-value">{eventVenue}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Address:</div>
            <div class="info-value">{eventAddress}, {eventCity}</div>
          </div>
        </div>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">👤 Ticket Information</h2>
          
          <div class="info-row">
            <div class="info-label">Ticket Type:</div>
            <div class="info-value">{ticketType}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Quantity:</div>
            <div class="info-value">{quantity} ticket(s)</div>
          </div>
          <div class="info-row">
            <div class="info-label">Price Paid:</div>
            <div class="info-value">{ticketPrice}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Ticket Code:</div>
            <div class="info-value" style="font-family:monospace;font-weight:bold">{ticketCode}</div>
          </div>
          {matriculationNumberRow}
        </div>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">📞 Organizer Contact</h2>
          
          <div class="info-row">
            <div class="info-label">Organizer:</div>
            <div class="info-value">{organizerName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Phone:</div>
            <div class="info-value">{organizerPhone}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">{organizerEmail}</div>
          </div>
        </div>

        <div class="qr-code">
          <img src="{qrCodeImage}" alt="QR Code" />
          <div class="ticket-code">
            <strong>Scan this QR code at the entrance</strong>
          </div>
        </div>

        <div class="checkin-note">
          <p>📌 <strong>Important:</strong> This QR code will be scanned at the entrance. Please have it ready on your phone or printed.</p>
          <p style="margin-top:8px">⏰ Event check-in opens 30 minutes before start time.</p>
        </div>

        <div style="text-align:center">
          <a href="{eventLink}" class="btn">View Event Details →</a>
        </div>

        <p style="margin-top:24px;font-size:13px;color:#64748b;text-align:center">
          Need assistance? Contact us at <a href="mailto:support@naijapass.com.ng" style="color:#023020">support@naijapass.com.ng</a>
        </p>
      </div>

      <div class="footer">
        <p style="margin:0">© {year} NaijaPass. All rights reserved.</p>
        <p style="margin:8px 0 0;font-size:12px">Secure ticket powered by NaijaPass</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

export const ORGANIZER_TICKET_SOLD_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Ticket Sale - {eventTitle} | NaijaPass</title>
  <style>
    html,body{margin:0;padding:0;background:#f5f7fb;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0f1724}
    .wrap{max-width:680px;margin:28px auto;padding:0}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06)}
    .banner{background:linear-gradient(135deg, #023020 0%, #034f30 50%, #023020 100%);padding:32px 24px;text-align:center}
    .brand{font-weight:800;color:#fff;font-size:28px;margin:0}
    .brand span{color:#FFD700}
    .body{padding:32px}
    .event-title{font-size:24px;font-weight:800;color:#023020;margin:0 0 8px}
    .ticket-card{background:#f8fafc;border-radius:16px;padding:24px;margin:24px 0;border:2px solid #e2e8f0}
    .info-row{display:flex;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
    .info-label{width:140px;font-weight:700;color:#475569}
    .info-value{flex:1;color:#1e293b}
    .success-badge{background:#d1fae5;color:#065f46;padding:8px 16px;border-radius:30px;display:inline-block;font-weight:700;font-size:14px;margin-bottom:20px}
    .footer{padding:20px 24px;background:#fbfdff;border-top:1px solid #eef2f7;text-align:center;color:#64748b;font-size:13px}
    .btn{display:inline-block;background:#023020;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;margin-top:16px}
    @media (max-width:480px){
      .body{padding:20px}
      .info-row{flex-direction:column}
      .info-label{margin-bottom:4px}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="banner">
        <h1 class="brand">🇳🇬 Naija<span>Pass</span></h1>
      </div>

      <div class="body">
        <div class="success-badge">🎉 New Ticket Sale!</div>

        <p style="font-size:16px;margin:0 0 8px">Dear <strong>{organizerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#475569">Congratulations! Someone just purchased tickets for your event <strong>{eventTitle}</strong>.</p>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">🎟️ Event Details</h2>
          
          <div class="info-row">
            <div class="info-label">Event:</div>
            <div class="info-value">{eventTitle}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date & Time:</div>
            <div class="info-value">{eventDate} at {eventTime}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Venue:</div>
            <div class="info-value">{eventVenue}, {eventCity}</div>
          </div>
        </div>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">👤 Buyer Information</h2>
          
          <div class="info-row">
            <div class="info-label">Name:</div>
            <div class="info-value">{buyerName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">{buyerEmail}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Phone:</div>
            <div class="info-value">{buyerPhone}</div>
          </div>
        </div>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">🎫 Ticket Details</h2>
          
          <div class="info-row">
            <div class="info-label">Ticket Type:</div>
            <div class="info-value">{ticketType}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Quantity:</div>
            <div class="info-value">{quantity} ticket(s)</div>
          </div>
          <div class="info-row">
            <div class="info-label">Ticket Code:</div>
            <div class="info-value" style="font-family:monospace;font-weight:bold">{ticketCode}</div>
          </div>
        </div>

        <div class="ticket-card">
          <h2 style="margin:0 0 16px;font-size:18px;color:#023020">💰 Payment Summary</h2>
          
          <div class="info-row">
            <div class="info-label">Ticket Price:</div>
            <div class="info-value">₦{ticketPrice}</div>
          </div>
        </div>

        <div style="text-align:center">
          <a href="{dashboardUrl}" class="btn">Go to Dashboard →</a>
        </div>

        <p style="margin-top:24px;font-size:13px;color:#64748b;text-align:center">
          Need assistance? Contact us at <a href="mailto:support@naijapass.com.ng" style="color:#023020">support@naijapass.com.ng</a>
        </p>
      </div>

      <div class="footer">
        <p style="margin:0">© {year} NaijaPass. All rights reserved.</p>
        <p style="margin:8px 0 0;font-size:12px">Secure ticket powered by NaijaPass</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();