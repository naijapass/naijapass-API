// services/emailService.js
import { 
  ORGANIZER_MAGIC_LINK_EMAIL_TEMPLATE,
  ORGANIZER_WELCOME_EMAIL_TEMPLATE,
  TICKET_EMAIL_TEMPLATE,
  ORGANIZER_TICKET_SOLD_EMAIL_TEMPLATE
} from './email.template.js';
import { mailtrapClient, sender } from './mailtrap.js';

// -------------------
// Generic send email
// -------------------
const sendEmail = async (to, subject, html) => {
  if (!to) throw new Error("Recipient email is required.");
  const recipient = [{ email: to }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject,
      html,
      category: subject,
    });
    console.log(`Email sent successfully to ${to}`, response);
  } catch (error) {
    console.error(`Error sending email to ${to}`, error);
    throw new Error(`Error sending email: ${error}`);
  }
};

// -------------------
// Template rendering
// -------------------
function renderTemplate(template, replacements) {
  let html = template;
  Object.entries(replacements).forEach(([key, val]) => {
    const re = new RegExp(`\\{${key}\\}`, 'g');
    html = html.replace(re, val !== undefined && val !== null ? val : '');
  });
  return html;
}

// -------------------
// Ticket Email with Full Details
// -------------------
export const sendTicketEmail = async (to, ticketData) => {
  const {
    name,
    eventTitle,
    eventCategory,
    eventDate,
    eventTime,
    eventVenue,
    eventAddress,
    eventCity,
    eventBannerImage,
    organizerName,
    organizerPhone,
    organizerEmail,
    ticketType,
    quantity,
    ticketPrice,
    ticketCode,
    matriculationNumber,
    qrCodeImage,
    eventLink
  } = ticketData;

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(ticketPrice);

  // Prepare event image HTML
  const eventImageHtml = eventBannerImage 
    ? `<img src="${eventBannerImage}" alt="${eventTitle}" class="event-image" />`
    : '';

  const matriculationNumberRow = matriculationNumber
    ? `
          <div class="info-row">
            <div class="info-label">Matric No:</div>
            <div class="info-value">${matriculationNumber}</div>
          </div>`
    : '';

  const subject = ` Your Ticket for ${eventTitle} - NaijaPass`;
  
  const html = renderTemplate(TICKET_EMAIL_TEMPLATE, {
    buyerName: name,
    eventTitle,
    eventCategory: eventCategory || 'Event',
    eventDate,
    eventTime,
    eventVenue,
    eventAddress: eventAddress || 'Not specified',
    eventCity,
    eventImage: eventImageHtml,
    organizerName,
    organizerPhone: organizerPhone || 'Not provided',
    organizerEmail,
    ticketType,
    quantity: quantity.toString(),
    ticketPrice: formattedPrice,
    ticketCode,
    matriculationNumberRow,
    qrCodeImage,
    eventLink,
    year: new Date().getFullYear().toString()
  });

  await sendEmail(to, subject, html);
};

// Export other email functions
export const sendOrganizerWelcomeEmail = async (to, { name, year = new Date().getFullYear(), dashboardUrl }) => {
  const subject = 'Welcome to NaijaPass!';
  const html = renderTemplate(ORGANIZER_WELCOME_EMAIL_TEMPLATE, { name, year, dashboardUrl });
  await sendEmail(to, subject, html);
};

export const sendMagicLinkEmail = async (to, { name, magicLink, expiryMinutes }) => {
  const subject = 'Your NaijaPass Magic Link';
  const html = renderTemplate(ORGANIZER_MAGIC_LINK_EMAIL_TEMPLATE, { name, magicLink, expiryMinutes });
  await sendEmail(to, subject, html);
};

export const sendOrganizerTicketSoldEmail = async (to, data) => {
  const subject = ` New Ticket Sale - ${data.eventTitle}`;
  const html = renderTemplate(ORGANIZER_TICKET_SOLD_EMAIL_TEMPLATE, {
    organizerName: data.organizerName,
    eventTitle: data.eventTitle,
    eventDate: data.eventDate,
    eventTime: data.eventTime,
    eventVenue: data.eventVenue,
    eventCity: data.eventCity,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    buyerPhone: data.buyerPhone,
    ticketType: data.ticketType,
    quantity: data.quantity,
    ticketCode: data.ticketCode,
    ticketPrice: data.ticketPrice.toLocaleString(),
    platformFee: data.platformFee.toLocaleString(),
    customerPaid: data.customerPaid.toLocaleString(),
    organizerEarnings: data.organizerEarnings.toLocaleString(),
    dashboardUrl: data.dashboardUrl,
    year: new Date().getFullYear(),
  });
  await sendEmail(to, subject, html);
};