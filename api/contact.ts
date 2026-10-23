import { resolveMx } from "node:dns/promises";

/* Contact form endpoint (Vercel function). Sends the message to me with Reply-To set to the
   sender, then a short confirmation to the sender. Mail goes out through Resend's REST API. */
const OWNER = "bhandarirupesh162@gmail.com";
const FROM = process.env.CONTACT_FROM || "Rupesh Bhandari <hello@bhandarirupesh.com.np>";
const MIN_FILL_MS = 2000; // filled in faster than this is a bot
const LIMITS = { name: 80, email: 254, message: 5000 };
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
// kept in step with profile in src/data/site.ts
const SITE = "https://bhandarirupesh.com.np";
const LINKEDIN = "https://www.linkedin.com/in/rupesh-bhandari-5977b525a/";
const C = { paper: "#f7f5f1", card: "#ffffff", ink: "#3c3728", muted: "#7a7465", line: "#e8e3d9", orange: "#fea831" };
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const DISPLAY = "'Trebuchet MS', Helvetica, Arial, sans-serif";

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/* The domain must exist and accept mail, so typos like gmial.com are caught. */
async function domainTakesMail(email: string) {
  const domain = email.split("@")[1];
  try {
    const mx = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, no) => setTimeout(() => no(new Error("timeout")), 3000)),
    ]);
    return mx.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    // a DNS timeout shouldn't block a real person; a missing domain should
    return (err as Error).message === "timeout";
  }
}

async function send(key: string, mail: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(mail),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  // the id is what to search for in Resend's Emails log if a message goes missing
  const { id } = await res.json();
  console.log(`sent ${id} to ${(mail.to as string[]).join(", ")}`);
}

/* ---------- email templates ----------
   Table layout with inline styles: the only thing Gmail, Outlook and Apple Mail all render the same. */
const button = (href: string, label: string, bg = C.orange, fg = "#ffffff") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="border-radius:999px;background:${bg};">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:${DISPLAY};font-size:15px;font-weight:bold;color:${fg};text-decoration:none;border-radius:999px;">${label}</a>
    </td></tr></table>`;

// inline-block pills wrap onto their own line on narrow screens instead of squashing
const pill = (bg: string) =>
  `display:inline-block;white-space:nowrap;margin:0 8px 10px 0;padding:13px 26px;border-radius:999px;background:${bg};font-family:${DISPLAY};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;`;

function layout(preheader: string, body: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Rupesh Bhandari</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 20px;font-family:${DISPLAY};font-size:22px;font-weight:bold;color:${C.ink};">
      <a href="${SITE}" style="color:${C.ink};text-decoration:none;">rupesh bhandari<span style="color:${C.orange};">.</span></a>
    </td></tr>
    <tr><td style="background:${C.card};border-radius:20px;border:1px solid ${C.line};padding:36px 32px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink};">
      ${body}
    </td></tr>
    <tr><td style="padding:24px 4px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">
      <a href="${SITE}" style="color:${C.muted};">bhandarirupesh.com.np</a> &nbsp;·&nbsp;
      <a href="${LINKEDIN}" style="color:${C.muted};">LinkedIn</a> &nbsp;·&nbsp; Lalitpur, Nepal
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function ownerEmail(name: string, email: string, message: string) {
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" }).format(new Date());
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;width:84px;font-size:13px;color:${C.muted};vertical-align:top;">${label}</td>
     <td style="padding:6px 0;font-size:15px;color:${C.ink};">${value}</td></tr>`;
  const reply = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Re: your message on bhandarirupesh.com.np")}`;
  const html = layout(`${esc(name)}: ${esc(message.slice(0, 90))}`, `
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.orange};font-weight:bold;">New message</p>
      <h1 style="margin:0 0 20px;font-family:${DISPLAY};font-size:26px;line-height:1.25;color:${C.ink};">${esc(name)} got in touch</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};margin:0 0 24px;">
        <tr><td style="padding:10px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0">
          ${row("Name", esc(name))}
          ${row("Email", `<a href="mailto:${esc(email)}" style="color:${C.ink};">${esc(email)}</a>`)}
          ${row("Received", `${when} (Nepal time)`)}
        </table></td></tr>
      </table>
      <div style="background:${C.paper};border-left:4px solid ${C.orange};border-radius:8px;padding:18px 20px;margin:0 0 28px;white-space:pre-wrap;word-break:break-word;">${esc(message)}</div>
      ${button(reply, `Reply to ${esc(name.split(" ")[0])}`, C.ink)}
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};">Or just hit reply: this email's Reply-To is set to ${esc(email)}.</p>`);
  const text = `New message from your portfolio\n\nName: ${name}\nEmail: ${email}\nReceived: ${when} (Nepal time)\n\n${message}\n\nReply to this email to answer ${name}.`;
  return { subject: `New message from ${name.replace(/[\r\n]+/g, " ")}`, html, text };
}

// fixed wording, no visitor text, so the form can't be used to mail arbitrary content to strangers
function confirmationEmail() {
  const html = layout("Thanks for your message. I'll get back to you soon.", `
      <h1 style="margin:0 0 16px;font-family:${DISPLAY};font-size:28px;line-height:1.25;color:${C.ink};">Thanks for reaching out! <span style="color:${C.orange};">🙏</span></h1>
      <p style="margin:0 0 14px;">Namaste,</p>
      <p style="margin:0 0 14px;">Your message came through on my portfolio and is sitting in my inbox now. I read every one and usually reply within one or two working days, straight to this email address.</p>
      <p style="margin:0 0 28px;">In the meantime, feel free to look around my work or connect with me on LinkedIn.</p>
      <div>
        <a href="${SITE}" style="${pill(C.orange)}">View my portfolio</a>
        <a href="${LINKEDIN}" style="${pill("#0a66c2")}">Connect on LinkedIn</a>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid ${C.line};">
        <tr><td style="padding-top:20px;">
          <p style="margin:0;font-family:${DISPLAY};font-size:17px;font-weight:bold;color:${C.ink};">Rupesh Bhandari</p>
          <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Software Engineer · Lalitpur, Nepal</p>
          <p style="margin:8px 0 0;font-size:13px;"><a href="${SITE}" style="color:${C.ink};">bhandarirupesh.com.np</a> &nbsp;·&nbsp; <a href="${LINKEDIN}" style="color:${C.ink};">linkedin.com/in/rupesh-bhandari</a></p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:${C.muted};">You're getting this because someone used this address on the contact form at bhandarirupesh.com.np. If it wasn't you, you can ignore this email.</p>`);
  const text = `Namaste,

Thanks for reaching out! Your message came through on my portfolio and is sitting in my inbox now. I read every one and usually reply within one or two working days, straight to this email address.

In the meantime, feel free to look around my work or connect with me on LinkedIn:

Portfolio: ${SITE}
LinkedIn:  ${LINKEDIN}

Rupesh Bhandari
Software Engineer · Lalitpur, Nepal

You're getting this because someone used this address on the contact form at bhandarirupesh.com.np. If it wasn't you, you can ignore this email.`;
  return { subject: "Thanks for getting in touch, I'll reply soon", html, text };
}

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return json(500, { error: "Email isn't set up yet. Please email me directly." });

  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return json(400, { error: "Bad request." });
  }
  const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string).trim() : "");
  const name = str("name");
  const email = str("email").toLowerCase();
  const message = str("message");

  // honeypot filled or form filled too fast: pretend it worked. The fill time is measured in
  // the browser, so a visitor's clock being off doesn't matter.
  const fillMs = typeof data.elapsed === "number" ? data.elapsed : NaN;
  if (str("_gotcha") || (Number.isFinite(fillMs) && fillMs < MIN_FILL_MS)) {
    console.log(`dropped as bot (honeypot: ${!!str("_gotcha")}, fill ms: ${fillMs})`);
    return json(200, { ok: true });
  }

  if (!name || name.length > LIMITS.name) return json(400, { error: "Please add your name.", field: "name" });
  if (email.length > LIMITS.email || !EMAIL_RE.test(email)) return json(400, { error: "That email address doesn't look right.", field: "email" });
  if (!message || message.length > LIMITS.message) return json(400, { error: "Please write a message (up to 5000 characters).", field: "message" });
  if (!(await domainTakesMail(email))) return json(400, { error: "That email domain can't receive mail. Check for a typo?", field: "email" });

  try {
    await send(key, { from: FROM, to: [OWNER], reply_to: email, ...ownerEmail(name, email, message) });
  } catch (err) {
    console.error(err);
    return json(502, { error: "Couldn't send right now. Please email me directly." });
  }

  try {
    await send(key, { from: FROM, to: [email], reply_to: OWNER, ...confirmationEmail() });
  } catch (err) {
    console.error("confirmation failed", err);
  }

  return json(200, { ok: true });
}
