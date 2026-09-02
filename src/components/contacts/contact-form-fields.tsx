import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import { PHONE_INPUT_PATTERN } from "@/lib/validation";
import type { ContactWithClient } from "@/lib/queries/contacts";

export function ContactFormFields({
  contact,
  clients,
}: {
  contact?: ContactWithClient;
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("components.contacts.nameLabel", "Nombre")}</Label>
        <Input id="name" name="name" required defaultValue={contact?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="roleTitle">{t("components.contacts.roleLabel", "Cargo")}</Label>
          <Input id="roleTitle" name="roleTitle" defaultValue={contact?.role_title ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">{t("components.contacts.tagsLabel", "Tags (separados por coma)")}</Label>
          <Input
            id="tags"
            name="tags"
            placeholder={t("components.contacts.tagsPlaceholder", "Cliente clave, Exportador...")}
            defaultValue={contact?.tags?.join(", ") ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("components.contacts.emailLabel", "Email")}</Label>
          <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("components.contacts.phoneLabel", "Teléfono")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            pattern={PHONE_INPUT_PATTERN}
            title={t("components.contacts.phoneInvalidTitle", "Solo números, espacios, +, - y paréntesis")}
            defaultValue={contact?.phone ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">{t("components.contacts.accountLabel", "Cuenta (opcional)")}</Label>
        <Select name="clientId" defaultValue={contact?.client_id ?? "none"}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder={t("components.contacts.accountPlaceholder", "Sin cuenta")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("components.contacts.noAccountOption", "Sin cuenta")}</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("components.contacts.notesLabel", "Notas")}</Label>
        <Input id="notes" name="notes" defaultValue={contact?.notes ?? ""} />
      </div>
    </>
  );
}
