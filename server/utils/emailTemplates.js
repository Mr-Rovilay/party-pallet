export const getEmailTemplate = (type, data) => {
  // Use FRONTEND_URL from your .env file instead of BASE_URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const adminUrl = `${baseUrl}/admin`;
  // Add a fallback for WHATSAPP_NUMBER in case it's not in .env
  const whatsappUrl = `https://wa.me/${process.env.WHATSAPP_NUMBER || '2348012345678'}`;
  
  // Social media links with fallbacks
  const socialLinks = {
    facebook: process.env.FACEBOOK_URL || null,
    instagram: process.env.INSTAGRAM_URL || null,
    tiktok: process.env.TIKTOK_URL || null,
  };
  
  // Common footer component
  const footer = `
    <div style="text-align: center; font-size: 14px; color: #8B4513; padding-top: 20px;">
      <p>&copy; ${new Date().getFullYear()} Party Pallet. All rights reserved.</p>
      <div style="margin-top: 15px;">
        ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" style="color: #8B4513; text-decoration: none; margin: 0 10px;">Facebook</a>` : ''}
        ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" style="color: #8B4513; text-decoration: none; margin: 0 10px;">Instagram</a>` : ''}
        ${socialLinks.tiktok ? `<a href="${socialLinks.tiktok}" style="color: #8B4513; text-decoration: none; margin: 0 10px;">TikTok</a>` : ''}
      </div>
      <p style="margin-top: 10px;">
        Contact us: 
        <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> | 
        <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">Email</a>
      </p>
    </div>
  `;
  
  // Common header component
  const header = `
    <div style="text-align: center; background-color: #8B4513; padding: 15px;">
      <h1 style="color: #FFF5E1; margin: 0; font-size: 28px;">Party Pallet</h1>
      <p style="color: #FFF5E1; margin: 5px 0 0; font-size: 14px;">Creating Beautiful Celebrations</p>
    </div>
  `;
  
  // Common content wrapper
  const contentWrapper = (content) => `
    <div style="padding: 25px; background-color: #F5F5DC; border-radius: 8px; box-shadow: 0 2px 10px rgba(139, 69, 19, 0.1);">
      ${content}
    </div>
  `;
  
  // Common button component
  const button = (text, url, extraStyles = '') => `
    <a href="${url}" style="
      background-color: #DAA520; 
      color: #FFF5E1; 
      padding: 12px 25px; 
      text-decoration: none; 
      border-radius: 5px; 
      font-size: 16px; 
      font-weight: bold;
      display: inline-block;
      margin-top: 20px;
      ${extraStyles}
    ">${text}</a>
  `;
  
  const templates = {
    clientConfirmation: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Booking Confirmation</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          <p style="font-size: 16px;">Thank you for booking with Party Pallet! Your <strong>${data.eventType}</strong> event is scheduled as follows:</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Date:</strong> ${data.eventDate}</li>
              <li><strong>Time:</strong> ${data.startTime} - ${data.endTime}</li>
              <li><strong>Location:</strong> ${data.location}</li>
              <li><strong>Estimated Cost:</strong> ${data.estimate} ${data.currency}</li>
              ${data.isOvernight ? `<li><strong>Overnight Surcharge:</strong> ${data.overnightSurcharge} ${data.currency}</li>` : ''}
              <li><strong>Deposit Required:</strong> ${data.depositRequired} ${data.currency}</li>
            </ul>
          </div>
          
          <p style="font-size: 16px;">We'll contact you soon to finalize details. For inquiries, reach out via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email us at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
          
          <div style="text-align: center;">
            ${button('Visit Our Website', baseUrl)}
          </div>
        `)}
        ${footer}
      </div>
    `,
    adminNotification: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">New Booking Notification</h2>
          <p style="font-size: 16px;">A new booking has been received:</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Client Information</h3>
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Name:</strong> ${data.clientName}</li>
              <li><strong>Email:</strong> ${data.clientEmail}</li>
              <li><strong>Phone:</strong> ${data.clientPhone}</li>
            </ul>
            
            <h3 style="color: #8B4513; margin-top: 20px;">Event Details</h3>
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Type:</strong> ${data.eventType}</li>
              <li><strong>Date:</strong> ${data.eventDate}</li>
              <li><strong>Time:</strong> ${data.startTime} - ${data.endTime}</li>
              <li><strong>Location:</strong> ${data.location}</li>
              <li><strong>Estimated Cost:</strong> ${data.estimate} ${data.currency}</li>
              ${data.isOvernight ? `<li><strong>Overnight Surcharge:</strong> ${data.overnightSurcharge} ${data.currency}</li>` : ''}
            </ul>
          </div>
          
          <p style="font-size: 16px;">Please review the booking in the admin dashboard.</p>
          
          <div style="text-align: center;">
            ${button('Go to Dashboard', adminUrl)}
          </div>
        `)}
        ${footer}
      </div>
    `,
    statusUpdate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Booking Status Update</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; margin: 0;">Your booking status has been updated to:</p>
            <p style="font-size: 24px; font-weight: bold; color: #DAA520; margin: 10px 0;">${data.status}</p>
          </div>
          
          <p style="font-size: 16px;">Your booking for a <strong>${data.eventType}</strong> on <strong>${data.eventDate}</strong> at <strong>${data.startTime}</strong> is now <strong>${data.status}</strong>.</p>
          
          ${data.note ? `<p style="font-size: 16px; font-style: italic;">Note: ${data.note}</p>` : ''}
          
          <p style="font-size: 16px;">For any questions, contact us via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
          
          <div style="text-align: center;">
            ${button('View Booking Details', `${baseUrl}/bookings/${data.bookingId}`)}
          </div>
        `)}
        ${footer}
      </div>
    `,
    paymentConfirmation: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Payment Confirmation</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          <p style="font-size: 16px;">Thank you for your payment! We've successfully received your deposit for your upcoming <strong>${data.eventType}</strong> event.</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Payment Details:</h3>
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Amount Paid:</strong> ${data.paymentAmount} ${data.currency}</li>
              <li><strong>Payment Reference:</strong> ${data.paymentReference}</li>
              <li><strong>Payment Date:</strong> ${data.paymentDate}</li>
              <li><strong>Event Date:</strong> ${data.eventDate}</li>
              <li><strong>Event Time:</strong> ${data.startTime} - ${data.endTime}</li>
              <li><strong>Location:</strong> ${data.location}</li>
            </ul>
          </div>
          
          <p style="font-size: 16px;">Your booking status is now <strong style="color: #DAA520;">deposit-paid</strong>. We'll be in touch soon to finalize the details for your event.</p>
          
          <p style="font-size: 16px;">For any questions or changes, feel free to contact us via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email us at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
          
          <div style="text-align: center;">
            ${button('Visit Our Website', baseUrl)}
          </div>
        `)}
        ${footer}
      </div>
    `,
    paymentFailure: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Payment Issue</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          <p style="font-size: 16px;">We encountered an issue processing your payment for your <strong>${data.eventType}</strong> event on <strong>${data.eventDate}</strong>.</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Payment Details:</h3>
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Payment Reference:</strong> ${data.paymentReference}</li>
              <li><strong>Status:</strong> <span style="color: #D32F2F;">Failed</span></li>
            </ul>
          </div>
          
          <p style="font-size: 16px;">This could be due to insufficient funds, an expired card, or other bank issues. Please try again with a different payment method or contact your bank.</p>
          
          <p style="font-size: 16px;">If you continue to experience issues, please contact us via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email us at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
          
          <div style="text-align: center;">
            ${button('Retry Payment', `${baseUrl}/payment/retry?reference=${data.paymentReference}`, 'background-color: #D32F2F;')}
          </div>
        `)}
        ${footer}
      </div>
    `,
    // New template for booking cancellation
    cancellation: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Booking Cancellation</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          <p style="font-size: 16px;">We regret to inform you that your booking for a <strong>${data.eventType}</strong> on <strong>${data.eventDate}</strong> at <strong>${data.startTime}</strong> has been cancelled.</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Cancellation Details:</h3>
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Reason:</strong> ${data.reason}</li>
              <li><strong>Cancelled On:</strong> ${data.cancellationDate}</li>
            </ul>
          </div>
          
          <p style="font-size: 16px;">We apologize for any inconvenience this may cause. If you have any questions or would like to reschedule, please contact us via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
          
          <div style="text-align: center;">
            ${button('Book New Event', baseUrl)}
          </div>
        `)}
        ${footer}
      </div>
    `,
    // New template for event completion with testimonial request
    eventCompletion: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Event Completed - Thank You!</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          <p style="font-size: 16px;">Thank you for choosing Party Pallet for your <strong>${data.eventType}</strong> event on <strong>${data.eventDate}</strong>. We hope everything was perfect and you had a wonderful time!</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; margin: 0;">We would love to hear your feedback!</p>
            <p style="font-size: 16px; margin: 10px 0;">Your review helps us improve and assists other clients in making decisions.</p>
          </div>
          
          <p style="font-size: 16px;">If you enjoyed our service, please consider leaving a testimonial on our website or social media.</p>
          
          <div style="text-align: center;">
            ${button('Leave a Testimonial', `${baseUrl}/testimonials/new?bookingId=${data.bookingId}`)}
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">For future events, feel free to contact us via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
          
          <div style="text-align: center; margin-top: 20px;">
            ${button('Book Another Event', baseUrl, 'background-color: #8B4513;')}
          </div>
        `)}
        ${footer}
      </div>
    `,
    // New template for deposit reminder
    depositReminder: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF5E1; padding: 20px; color: #8B4513;">
        ${header}
        ${contentWrapper(`
          <h2 style="color: #8B4513; margin-top: 0;">Deposit Payment Reminder</h2>
          <p style="font-size: 16px;">Dear ${data.clientName},</p>
          <p style="font-size: 16px;">This is a friendly reminder that your deposit payment of <strong>${data.depositRequired} ${data.currency}</strong> for your <strong>${data.eventType}</strong> event is due soon.</p>
          
          <div style="background-color: #FFF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Booking Details:</h3>
            <ul style="font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Event Type:</strong> ${data.eventType}</li>
              <li><strong>Date:</strong> ${data.eventDate}</li>
              <li><strong>Time:</strong> ${data.startTime} - ${data.endTime}</li>
              <li><strong>Location:</strong> ${data.location}</li>
              <li><strong>Deposit Due:</strong> ${data.dueDate}</li>
            </ul>
          </div>
          
          <p style="font-size: 16px;">To secure your booking, please make your deposit payment at your earliest convenience.</p>
          
          <div style="text-align: center;">
            ${button('Pay Deposit Now', `${baseUrl}/payment?bookingId=${data.bookingId}`)}
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">If you have any questions or need assistance with payment, please contact us via <a href="${whatsappUrl}" style="color: #DAA520; text-decoration: none;">WhatsApp</a> or email at <a href="mailto:${data.supportEmail}" style="color: #DAA520; text-decoration: none;">${data.supportEmail}</a>.</p>
        `)}
        ${footer}
      </div>
    `
  };
  
  return templates[type] || '';
};