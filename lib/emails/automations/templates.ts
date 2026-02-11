const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pikk-up.com'

function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`
}

function buildHeaderHtml() {
  return `
    <tr><td style="padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a1a1a;">PikkUp</h1>
    </td></tr>`
}

function buildFooterHtml(email: string) {
  return `
  <tr>
    <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 12px; color: #999;">
        <a href="${unsubscribeUrl(email)}" style="color: #999; text-decoration: underline;">Unsubscribe</a> from these emails
      </p>
    </td>
  </tr>`
}

function wrapLayout(contentHtml: string, email: string) {
  return `
<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    ${buildHeaderHtml()}
    <tr><td style="padding: 30px;">
      ${contentHtml}
    </td></tr>
    ${buildFooterHtml(email)}
  </table>
</body></html>`
}

export function getEmailTemplate(type: string, email: string, payload: any): { subject: string, html: string } {
  const templateFn = templates[type as keyof typeof templates]
  if (templateFn) {
    return templateFn(email, payload)
  }
  return {
    subject: "Update from PickUp Yoga",
    html: wrapLayout(`<p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">Hello! You have a new message from PickUp Yoga.</p>`, email)
  }
}

export const templates = {
  lead_no_booking_1: (email: string, payload: any) => {
    const name = payload.firstName || 'there'
    const content = `
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">Your free class is waiting! We noticed you signed up but haven't booked your spot yet.</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">This offer is only valid if you book in the next 30 minutes. Come flow with us!</p>
      <a href="${SITE_URL}/classes?free=1" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">Claim my free class</a>
    `
    return {
      subject: "Your free class is waiting (book in 30 min)",
      html: wrapLayout(content, email)
    }
  },

  lead_no_booking_2: (email: string, payload: any) => {
    const name = payload.firstName || 'there'
    const content = `
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">Try a class this week! We have some great sessions coming up that we think you'll love.</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">Here are 3 options for you to get started:</p>
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666;">• Morning Vinyasa Flow</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #666;">• Evening Restoration</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #666;">• Weekend Breathwork</p>
      </div>
      <a href="${SITE_URL}/classes" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View all classes</a>
    `
    return {
      subject: "Try a class this week — here are 3 options",
      html: wrapLayout(content, email)
    }
  },

  pre_class_reminder: (email: string, payload: any) => {
    const name = payload.firstName || 'there'
    const content = `
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">You’re booked for <strong>${payload.sessionTitle}</strong> with ${payload.instructorName || 'Tatiana'} tomorrow.</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #666;">📅 ${payload.sessionTime}</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #666;">📍 PickUp Studio, 2500 South Miami Avenue</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">We recommend arriving 10 minutes early to settle in. See you on the mat!</p>
      <a href="${SITE_URL}/my-classes" style="display: inline-block; padding: 12px 24px; border: 1px solid #1a1a1a; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-size: 14px;">View my classes</a>
    `
    return {
      subject: `Reminder: you’re booked for ${payload.instructorName || 'Tatiana'}’s class tomorrow`,
      html: wrapLayout(content, email)
    }
  },

  post_class_followup: (email: string, payload: any) => {
    const name = payload.firstName || 'there'
    const content = `
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">How was ${payload.instructorName || 'Tatiana'}’s class today? We hope you’re feeling centered and refreshed.</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;"><strong>${payload.sessionTitle}</strong> is a beautiful practice that focuses on connecting breath with movement. It's a great way to build strength and flexibility while calming the mind.</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">Ready for your next session?</p>
      <a href="${SITE_URL}/classes" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">Rebook now</a>
    `
    return {
      subject: `How was ${payload.instructorName || 'Tatiana'}’s class?`,
      html: wrapLayout(content, email)
    }
  },

  rebook_nudge: (email: string, payload: any) => {
    const name = payload.firstName || 'there'
    const content = `
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">${payload.instructorName || 'Tatiana'}’s back this week! We noticed you enjoyed their ${payload.sessionTitle} class recently.</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">Want to join the same class again? Reserve your spot before it fills up.</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #666;">📅 ${payload.sessionTime}</p>
      <a href="${SITE_URL}/book/${payload.classId}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">Book my spot</a>
    `
    return {
      subject: `${payload.instructorName || 'Tatiana'}’s back this week — want the same class again?`,
      html: wrapLayout(content, email)
    }
  }
}
