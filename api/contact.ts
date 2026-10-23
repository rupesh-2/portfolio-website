import { resolveMx } from "node:dns/promises";

/* Contact form endpoint (Vercel function). Sends the message to me with Reply-To set to the
   sender, then a short confirmation to the sender. Mail goes out through Resend's REST API. */
const OWNER = "bhandarirupesh162@gmail.com";
const FROM = process.env.CONTACT_FROM || "Rupesh Bhandari <hello@bhandarirupesh.com.np>";
const MIN_FILL_MS = 3000; // faster than this is a bot
const LIMITS = { name: 80, email: 254, message: 5000 };
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

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

  // honeypot filled or form sent too fast: pretend it worked
  if (str("company") || Date.now() - Number(data.t) < MIN_FILL_MS) return json(200, { ok: true });

  if (!name || name.length > LIMITS.name) return json(400, { error: "Please add your name.", field: "name" });
  if (email.length > LIMITS.email || !EMAIL_RE.test(email)) return json(400, { error: "That email address doesn't look right.", field: "email" });
  if (!message || message.length > LIMITS.message) return json(400, { error: "Please write a message (up to 5000 characters).", field: "message" });
  if (!(await domainTakesMail(email))) return json(400, { error: "That email domain can't receive mail. Check for a typo?", field: "email" });

  try {
    await send(key, {
      from: FROM,
      to: [OWNER],
      reply_to: email,
      subject: `Portfolio message from ${name.replace(/[\r\n]+/g, " ")}`,
      text: `${name} <${email}>\n\n${message}`,
      html: `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
    });
  } catch (err) {
    console.error(err);
    return json(502, { error: "Couldn't send right now. Please email me directly." });
  }

  // fixed wording, no visitor text, so the form can't be used to mail arbitrary content to strangers
  try {
    await send(key, {
      from: FROM,
      to: [email],
      reply_to: OWNER,
      subject: "Thanks for getting in touch",
      text: "Hi,\n\nThanks for your message through bhandarirupesh.com.np. I've received it and will get back to you at this address soon.\n\nRupesh Bhandari\nhttps://bhandarirupesh.com.np",
      html: `<p>Hi,</p><p>Thanks for your message through <a href="https://bhandarirupesh.com.np">bhandarirupesh.com.np</a>. I've received it and will get back to you at this address soon.</p><p>Rupesh Bhandari</p>`,
    });
  } catch (err) {
    console.error("confirmation failed", err);
  }

  return json(200, { ok: true });
}
