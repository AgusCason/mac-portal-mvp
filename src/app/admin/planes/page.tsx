import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { NewPlanDialog } from "@/components/plans/new-plan-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types/database";

export default async function AdminPlanesPage() {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("price_monthly");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Planes y facturación</h1>
          <p className="text-muted-foreground text-sm">
            Información financiera — visible solo para vos (RLS bloquea a editores).
          </p>
        </div>
        <NewPlanDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(plans as Plan[] ?? []).map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between">
                <span>{plan.name}</span>
                <span className="tabular-nums text-lg">{formatCurrency(plan.price_monthly, plan.currency)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{plan.description}</p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-xs">
                {(plan.features ?? []).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
