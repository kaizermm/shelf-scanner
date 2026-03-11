import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

export async function callOrchestrator({ imagePath, deviceId, scanId, preferences }) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("N8N_WEBHOOK_URL is not set in .env");

  const form = new FormData();
  form.append("image",       fs.createReadStream(imagePath));
  form.append("device_id",   String(deviceId));
  form.append("scan_id",     String(scanId));
  form.append("preferences", JSON.stringify(preferences ?? {}));

  const response = await fetch(webhookUrl, {
    method:  "POST",
    body:    form,
    headers: form.getHeaders(),
    timeout: 120_000,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n webhook error ${response.status}: ${text.slice(0, 300)}`);
  }

  return response.json();
}
