import { requireRole } from "@/lib/auth";
import { getContacts, type ContactWithClient } from "@/lib/queries/contacts";
import { getSelectableClients } from "@/lib/queries/content";
import { NewContactDialog } from "@/components/contacts/new-contact-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
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
      <PageHeader
        title={t("nav.ventasContactos.contactos", "Contactos")}
        description="Directorio de personas y referentes vinculados a tus cuentas."
        actions={
          <div className="flex items-center gap-2">
            <ExportCsvButton filename="contactos.csv" csv={contactsCsv} disabled={contacts.length === 0} />
            <NewContactDialog clients={clients} />
          </div>
        }
      />

      <ContactsTable contacts={contacts} clients={clients} />
    </div>
  );
}
