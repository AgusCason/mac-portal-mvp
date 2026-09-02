-- Verificación en dos pasos (2FA) — pedido explícito: "me interesa pero no
-- YA". Queda armada y funcionando de punta a punta (enroll + login con
-- Supabase Auth MFA, ver my-profile-dialog.tsx y login-form.tsx), pero
-- APAGADA por defecto acá mismo: mientras este flag esté en `enabled=false`,
-- nadie ve el botón para activarla en Mi Perfil > Seguridad. Prender este
-- switch en Configuración > Módulos es lo único que hace falta para que
-- empiece a ofrecerse de verdad — sin ningún deploy ni migración extra.
insert into public.module_flags (key, enabled)
values ('verificacion-2fa', false)
on conflict (key) do nothing;
