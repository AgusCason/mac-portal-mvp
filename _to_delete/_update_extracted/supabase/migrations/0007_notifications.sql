-- 0007_notifications.sql
-- Columnas de soporte para las automatizaciones de WhatsApp + Cron Jobs:
--  - content_items.publish_reminder_sent_at: evita que el aviso "30 min antes
--    de publicar" (Netlify Scheduled Function, corre cada 15 min) se mande
--    más de una vez por pieza.
--  - billing_invoices.delinquency_alert_sent_at: evita que la alerta interna
--    de "cliente moroso (15d+)" al admin se repita todos los días — se manda
--    una sola vez por factura, el admin decide manualmente si bloquear.

alter table public.content_items
  add column if not exists publish_reminder_sent_at timestamptz;

alter table public.billing_invoices
  add column if not exists delinquency_alert_sent_at timestamptz;
