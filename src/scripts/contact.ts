/* Contact dialog on the work pager: opens from "Say Namaste!", posts to /api/contact. */
export function initContact(container: HTMLElement) {
  const dialog = container.querySelector<HTMLDialogElement>("[data-contact]");
  const form = dialog?.querySelector("form");
  const status = dialog?.querySelector<HTMLElement>("[data-contact-status]");
  const send = form?.querySelector<HTMLButtonElement>("[type=submit]");
  if (!dialog || !form || !status || !send) return () => {};

  let openedAt = 0;
  const say = (msg: string, error = false) => {
    status.textContent = msg;
    status.classList.toggle("is-error", error);
  };
  const open = () => {
    openedAt = Date.now();
    say("");
    dialog.showModal();
  };
  const close = () => dialog.close();
  const onBackdrop = (e: MouseEvent) => { if (e.target === dialog) close(); };

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
    const body = { ...Object.fromEntries(new FormData(form)), t: openedAt };
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

  const openers = [...container.querySelectorAll<HTMLElement>("[data-contact-open]")];
  const closer = dialog.querySelector<HTMLElement>("[data-contact-close]");
  openers.forEach((b) => b.addEventListener("click", open));
  closer?.addEventListener("click", close);
  dialog.addEventListener("click", onBackdrop);
  form.addEventListener("submit", onSubmit);

  return () => {
    openers.forEach((b) => b.removeEventListener("click", open));
    closer?.removeEventListener("click", close);
    dialog.removeEventListener("click", onBackdrop);
    form.removeEventListener("submit", onSubmit);
    if (dialog.open) dialog.close();
  };
}
