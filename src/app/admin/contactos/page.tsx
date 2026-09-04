import { requireRole } from "@/lib/auth";
import { getContacts, type ContactWithClient } from "@/lib/queries/contacts";
import { getSelectableClients } from "@/lib/queries/content";
import { NewContactDialog } from "@/components/contacts/new-contact-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { getT } from "@/lib/i18n/dictionary";

const CONTACT_CSV_COLUMNS: CsvColumn<ContactWithClient>[] = [
  { header: "Nombre", value: (c) => c.name },
  { header: "Cargo", value: (c) => c.role_title },
  { header: "Email", value: (c) => c.email },
  { header: "Teléfono", value: (c) => c.phone },
  { header: "Cliente", value: (c) => c.client_name },
  { header: "Tags", value: (c) => c.tags.join(" / ") },
];

/**
 * Management > Contactos — directorio de personas del workspace.
 */
export default async function AdminContactosPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);

  const [clients, contacts] = await Promise.all([getSelectableClients(), getContacts()]);
  const contactsCsv = buildCsv(CONTACT_CSV_COLUMNS, contacts);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.management.contactos", "Contactos")}</h1>
          <p className="text-muted-foreground text-sm">
            Directorio de personas y referentes vinculados a tus cuentas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton filename="contactos.csv" csv={contactsCsv} disabled={contacts.length === 0} />
          <NewContactDialog clients={clients} />
        </div>
      </div>

      <ContactsTable contacts={contacts} clients={clients} />
    </div>
  );
}
