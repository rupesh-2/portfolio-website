/* Contact form on the work pager's contact slide: posts to /api/contact. */
export function initContact(container: HTMLElement) {
  const form = container.querySelector<HTMLFormElement>("[data-contact]");
  const status = form?.querySelector<HTMLElement>("[data-contact-status]");
  const send = form?.querySelector<HTMLButtonElement>("[type=submit]");
  if (!form || !status || !send) return () => {};

  // time of first interaction; the API drops submissions that come too fast to be human
  let startedAt = 0;
  const onFocus = () => { startedAt ||= Date.now(); };
  const say = (msg: string, error = false) => {
    status.textContent = msg;
    status.classList.toggle("is-error", error);
  };

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    const field = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[required], textarea[required]")].find((f) => !f.checkValidity());
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
      say(field.name === "email" ? "Please enter a valid email address." : `Please fill in your ${field.name}.`, true);
      return;
    }

    send.disabled = true;
    say("Sending…");
    const body = { ...Object.fromEntries(new FormData(form)), t: startedAt };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field) form.querySelector(`[name="${data.field}"]`)?.setAttribute("aria-invalid", "true");
        say(data.error || "Couldn't send right now. Please email me directly.", true);
        return;
      }
      form.reset();
      say("Sent! Check your inbox for a confirmation.");
    } catch {
      say("You seem to be offline. Please try again.", true);
    } finally {
      send.disabled = false;
    }
  };

  form.addEventListener("focusin", onFocus);
  form.addEventListener("submit", onSubmit);
  return () => {
    form.removeEventListener("focusin", onFocus);
    form.removeEventListener("submit", onSubmit);
  };
}
