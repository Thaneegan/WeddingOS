import { env } from "@/lib/env";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
};

function renderEmail(input: TransactionalEmailInput) {
  const rows = Object.entries(input.payload)
    .map(([key, value]) => `<tr><td style="padding:4px 12px;color:#6f6a61">${key}</td><td style="padding:4px 12px;color:#191714">${String(value)}</td></tr>`)
    .join("");

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#191714">
      <h1 style="font-size:22px">Wedding OS</h1>
      <p>${input.subject}</p>
      <table>${rows}</table>
    </div>
  `;
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const from = env.EMAIL_FROM ?? "Wedding OS <hello@weddingos.local>";
  const shouldSend = env.EMAIL_PROVIDER_MODE === "resend" && Boolean(env.RESEND_API_KEY);

  if (!shouldSend) {
    return {
      ok: true,
      provider: "dry_run",
      providerMessageId: undefined,
      skipped: true,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: renderEmail(input),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

  if (!response.ok) {
    throw new Error(body.message ?? `Resend failed with status ${response.status}`);
  }

  return {
    ok: true,
    provider: "resend",
    providerMessageId: body.id,
    skipped: false,
  };
}
