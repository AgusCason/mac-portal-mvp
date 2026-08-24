import { requireRole } from "@/lib/auth";
import {
  MODULES_CATALOG,
  countModulesByStatus,
  totalModulesCount,
} from "@/lib/modules-catalog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Configuración > Módulos — Fase 2.4: índice maestro de todo lo que tiene
 * MAC Portal, agrupado por área y categoría, al estilo de MB Suite. Todavía
 * es solo informativo (no gatea nada), pero es la mejor referencia rápida
 * para saber qué está incluido y qué falta.
 */
export default async function AdminModulosPage() {
  await requireRole(["admin"]);
  const total = totalModulesCount();
  const incluidos = countModulesByStatus("incluido");
  const proximamente = countModulesByStatus("proximamente");

  const areas = Array.from(new Set(MODULES_CATALOG.map((c) => c.area)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Módulos</h1>
        <p className="text-muted-foreground text-sm">
          {total} módulos · {incluidos} incluidos · {proximamente} próximamente
        </p>
      </div>

      {areas.map((area) => (
        <Card key={area}>
          <CardHeader>
            <CardTitle>{area}</CardTitle>
            <CardDescription>
              {MODULES_CATALOG.filter((c) => c.area === area).reduce(
                (sum, c) => sum + c.modules.length,
                0
              )}{" "}
              módulos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MODULES_CATALOG.filter((c) => c.area === area).map((cat) => (
              <div key={cat.category}>
                <p className="mb-2 text-sm font-medium">{cat.category}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Dependencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cat.modules.map((m) => (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md text-sm">
                          {m.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.status === "incluido" ? "success" : "secondary"}>
                            {m.status === "incluido" ? "Incluido" : "Próximamente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {m.dependsOn ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
