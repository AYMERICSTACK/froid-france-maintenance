import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEquipment({
  equipmentType,
  brand,
  model,
}: {
  equipmentType: string;
  brand?: string | null;
  model?: string | null;
}) {
  return [equipmentType, brand, model].filter(Boolean).join(" • ");
}

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
  const equipmentDetails = formatEquipment({ equipmentType, brand, model });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Rappel J-30 entretien - ${clientName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Rappel entretien J-30</h2>
        <p>Un contrat arrive à échéance dans 30 jours.</p>
        <p><strong>Client :</strong> ${clientName}</p>
        <p><strong>Équipement :</strong> ${equipmentDetails || "-"}</p>
        <p><strong>Date prévue :</strong> ${formatDate(date)}</p>
        <p>Merci de planifier l’intervention.</p>
      </div>
    `,
  });
}

export async function sendAppointmentConfirmation({
  email,
  clientName,
  equipmentType,
  brand,
  model,
  plannedDate,
}: {
  email: string;
  clientName: string;
  equipmentType: string;
  brand?: string | null;
  model?: string | null;
  plannedDate: Date;
}) {
  const equipmentDetails = formatEquipment({ equipmentType, brand, model });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Confirmation rendez-vous entretien - ${clientName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Votre rendez-vous d’entretien est confirmé</h2>
        <p>Bonjour ${clientName},</p>
        <p>Nous vous confirmons le rendez-vous pour l’entretien de votre installation.</p>
        <p><strong>Équipement :</strong> ${equipmentDetails || "-"}</p>
        <p><strong>Date et heure :</strong> ${formatDateTime(plannedDate)}</p>
        <p>En cas d’empêchement, merci de nous prévenir afin de reprogrammer l’intervention.</p>
        <p>À bientôt,<br/>Froid France Climatisation</p>
      </div>
    `,
  });
}

export async function sendInterventionReportEmail({
  email,
  clientName,
  equipmentType,
  plannedDate,
  pdf,
}: {
  email: string;
  clientName: string;
  equipmentType: string;
  plannedDate: Date | null;
  pdf: Buffer;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Rapport d’intervention - ${clientName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Rapport d’intervention</h2>
        <p>Bonjour ${clientName},</p>
        <p>Vous trouverez ci-joint le rapport d’intervention pour votre équipement : <strong>${equipmentType}</strong>.</p>
        ${plannedDate ? `<p><strong>Date :</strong> ${formatDateTime(plannedDate)}</p>` : ""}
        <p>Merci pour votre confiance.<br/>Froid France Climatisation</p>
      </div>
    `,
    attachments: [
      {
        filename: "rapport-intervention.pdf",
        content: pdf,
      },
    ],
  });
}
