import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMaintenanceReminder({
  email,
  clientName,
  equipmentType,
  brand,
  model,
  date,
}: {
  email: string;
  clientName: string;
  equipmentType: string;
  brand?: string | null;
  model?: string | null;
  date: Date;
}) {
  const equipmentDetails = [equipmentType, brand, model]
    .filter(Boolean)
    .join(" • ");

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: `Rappel J-30 entretien - ${clientName}`,
    html: `
      <h2>Rappel entretien J-30</h2>
      <p>Un contrat arrive à échéance dans 30 jours.</p>

      <p><strong>Client :</strong> ${clientName}</p>
      <p><strong>Équipement :</strong> ${equipmentDetails || "-"}</p>
      <p><strong>Date prévue :</strong> ${date.toLocaleDateString("fr-FR")}</p>

      <p>Merci de planifier l’intervention.</p>
    `,
  });
}
