import { requireRole } from "@/lib/auth";
import { getContacts } from "@/lib/queries/contacts";
import { getSelectableClients } from "@/lib/queries/content";
import { NewContactDialog } from "@/components/contacts/new-contact-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";

/**
 * Management > Contactos — directorio de personas del workspace.
 */
export default async function AdminContactosPage() {
  await requireRole(["admin"]);

  const [clients, contacts] = await Promise.all([getSelectableClients(), getContacts()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-muted-foreground text-sm">
            Directorio de personas y referentes vinculados a tus cuentas.
          </p>
        </div>
        <NewContactDialog clients={clients} />
      </div>

      <ContactsTable contacts={contacts} clients={clients} />
    </div>
  );
}
