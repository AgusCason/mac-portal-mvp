"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Save, Users } from "lucide-react";

import { saveBrandVoiceAction, suggestBrandVoiceFieldAction } from "@/app/actions/brand-voice";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ClientBrandVoice } from "@/types/database";

type FieldKey = "tone_personality" | "vocabulary" | "emoji_rules" | "target_audience" | "platform_settings";
type TFunc = (path: string, fallback?: string) => string;

function getFields(t: TFunc): { key: FieldKey; label: string; hint: string }[] {
  return [
    {
      key: "tone_personality",
      label: t("components.brandVoice.fieldToneLabel", "Tono y Personalidad"),
      hint: t("components.brandVoice.fieldToneHint", "Cómo suena la marca al hablar."),
    },
    {
      key: "vocabulary",
      label: t("components.brandVoice.fieldVocabularyLabel", "Vocabulario"),
      hint: t("components.brandVoice.fieldVocabularyHint", "Palabras/frases a usar y a evitar."),
    },
    {
      key: "emoji_rules",
      label: t("components.brandVoice.fieldEmojiLabel", "Reglas de Emojis y Formato"),
      hint: t("components.brandVoice.fieldEmojiHint", "Uso de emojis, mayúsculas, puntuación."),
    },
    {
      key: "target_audience",
      label: t("components.brandVoice.fieldAudienceLabel", "Audiencia Objetivo"),
      hint: t("components.brandVoice.fieldAudienceHint", "A quién le habla la marca."),
    },
    {
      key: "platform_settings",
      label: t("components.brandVoice.fieldPlatformLabel", "Ajustes por Plataforma"),
      hint: t("components.brandVoice.fieldPlatformHint", "Diferencias de tono entre IG/TikTok/YouTube."),
    },
  ];
}

const FIELD_FORM_NAME: Record<FieldKey, string> = {
  tone_personality: "tonePersonality",
  vocabulary: "vocabulary",
  emoji_rules: "emojiRules",
  target_audience: "targetAudience",
  platform_settings: "platformSettings",
};

/** Formulario de un cliente puntual — se remonta (vía `key`) cada vez que
 * cambia la cuenta seleccionada, así el estado local arranca siempre desde
 * los valores reales de esa cuenta sin necesitar un efecto sincronizador. */
function BrandVoiceForm({
  clientId,
  clientName,
  brandVoice,
}: {
  clientId: string;
  clientName: string;
  brandVoice: ClientBrandVoice | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const FIELDS = React.useMemo(() => getFields(t), [t]);
  const [values, setValues] = React.useState({
    tone_personality: brandVoice?.tone_personality ?? "",
    vocabulary: brandVoice?.vocabulary ?? "",
    emoji_rules: brandVoice?.emoji_rules ?? "",
    target_audience: brandVoice?.target_audience ?? "",
    platform_settings: brandVoice?.platform_settings ?? "",
  });
  const [savePending, startSave] = useTransition();
  const [suggestingField, setSuggestingField] = React.useState<FieldKey | null>(null);

  function handleSuggest(field: FieldKey) {
    setSuggestingField(field);
    startSave(async () => {
      const res = await suggestBrandVoiceFieldAction(clientName, field);
      setSuggestingField(null);
      if (res.ok) {
        setValues((prev) => ({ ...prev, [field]: res.text }));
        toast.success(t("components.brandVoice.suggestionApplied", "Sugerencia aplicada — revisá y guardá."));
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleSave(formData: FormData) {
    formData.set("clientId", clientId);
    startSave(async () => {
      const res = await saveBrandVoiceAction(formData);
      if (res.ok) {
        toast.success(t("components.brandVoice.saved", "Brand Voice guardado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form action={handleSave} className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={f.key}>{f.label}</Label>
              <span className="text-muted-foreground text-xs">{f.hint}</span>
            </div>
            <Textarea
              id={f.key}
              name={FIELD_FORM_NAME[f.key]}
              rows={3}
              value={values[f.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button type="submit" disabled={savePending}>
          {savePending && !suggestingField && <Loader2 className="animate-spin" />}
          <Save /> {t("components.brandVoice.saveButton", "Guardar Brand Voice")}
        </Button>
      </div>

      <div className="glass-card h-fit space-y-3 rounded-xl p-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4" /> {t("components.brandVoice.aiAgentTitle", "AI Agent")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t(
            "components.brandVoice.aiAgentDesc",
            "Generá un borrador con Claude para cualquier campo, a partir del nombre de la cuenta."
          )}
        </p>
        <div className="space-y-2">
          {FIELDS.map((f) => (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs"
              disabled={savePending}
              onClick={() => handleSuggest(f.key)}
            >
              {suggestingField === f.key ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {t("components.brandVoice.suggestPrefix", "Sugerir")} {f.label}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}

export function BrandVoiceView({
  clients,
  selectedClientId,
  brandVoice,
}: {
  clients: { id: string; name: string }[];
  selectedClientId: string | null;
  brandVoice: ClientBrandVoice | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClientName = clients.find((c) => c.id === selectedClientId)?.name ?? "";

  function handleClientChange(clientId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cliente", clientId);
    router.push(`/admin/social-media/brand-voice?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Label htmlFor="client-select">{t("components.brandVoice.accountLabel", "Cuenta")}</Label>
        <Select value={selectedClientId ?? undefined} onValueChange={handleClientChange}>
          <SelectTrigger id="client-select" className="w-full">
            <SelectValue placeholder={t("components.brandVoice.chooseAccountPlaceholder", "Elegí una cuenta")} />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedClientId ? (
        <EmptyState
          icon={Users}
          title={t("components.brandVoice.chooseAccountEmpty", "Elegí una cuenta para ver o editar su Brand Voice.")}
        />
      ) : (
        <BrandVoiceForm
          key={selectedClientId}
          clientId={selectedClientId}
          clientName={selectedClientName}
          brandVoice={brandVoice}
        />
      )}
    </div>
  );
}
