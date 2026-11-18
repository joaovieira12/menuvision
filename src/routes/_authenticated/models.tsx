import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Upload, RefreshCw, Sparkles, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { restaurantQuery } from "@/lib/restaurant-query";
import { menuQuery } from "@/lib/menu-query";
import { modelsQuery } from "@/lib/models-query";
import { generateModelSchema, MAX_TEST_MODEL_BYTES } from "@/lib/models-schema";
import { generateModel, refreshModel, uploadTestModel } from "@/lib/models.functions";
import { pageHead } from "@/lib/metadata";
import { DashboardShell } from "@/components/menuvision/dashboard-shell";
import { FoodModelViewer } from "@/components/menuvision/food-model-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export const Route = createFileRoute("/_authenticated/models")({
  head: () =>
    pageHead(
      "Modelos 3D",
      "Gere modelos por foto ou envie um GLB para visualizar em realidade aumentada.",
    ),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(restaurantQuery()),
      context.queryClient.ensureQueryData(menuQuery()),
      context.queryClient.ensureQueryData(modelsQuery()),
    ]),
  component: Models,
});
function Models() {
  const { data: restaurant } = useSuspenseQuery(restaurantQuery());
  const { data: menu } = useSuspenseQuery(menuQuery());
  const { data } = useSuspenseQuery(modelsQuery());
  const generate = useServerFn(generateModel);
  const refresh = useServerFn(refreshModel);
  const uploadGlb = useServerFn(uploadTestModel);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();
  const [dishId, setDishId] = useState<string | null>(null);
  const [width, setWidth] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadId || uploading) return;
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !/\.glb$/i.test(file.name) ||
      !file.size ||
      file.size > MAX_TEST_MODEL_BYTES
    ) {
      toast.error("Selecione um arquivo .glb de até 15 MB.");
      return;
    }
    const parsed = generateModelSchema.safeParse({
      dishId: uploadId,
      widthCm: Number(width.replace(",", ".")),
    });
    if (!parsed.success) {
      toast.error("Informe uma largura maior que zero e de até 200 cm.");
      return;
    }
    form.set("dishId", parsed.data.dishId);
    form.set("widthCm", String(parsed.data.widthCm));
    setUploading(true);
    try {
      const { id } = await uploadGlb({ data: form });
      await qc.invalidateQueries({ queryKey: modelsQuery().queryKey });
      setUploadId(null);
      setViewId(id);
      toast.success("Modelo enviado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o modelo.");
    } finally {
      setUploading(false);
    }
  }
  const view = data.jobs.find((j) => j.id === viewId);
  const dish = menu.dishes.find((d) => d.id === dishId);
  const uploadDish = menu.dishes.find((d) => d.id === uploadId);
  async function update(id: string) {
    try {
      await refresh({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["dish-models"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar.");
    }
  }
  useEffect(() => {
    const pending = data.jobs.filter(
      (j) => j.provider_task_id && ["queued", "running"].includes(j.status),
    );
    if (!pending.length) return;
    const timer = setInterval(() => {
      void Promise.all(pending.map((j) => refresh({ data: { id: j.id } })))
        .then(() => qc.invalidateQueries({ queryKey: ["dish-models"] }))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [data.jobs, refresh, qc]);
  async function submit() {
    if (!dishId) return;
    setBusy(true);
    try {
      await generate({ data: { dishId, widthCm: Number(width.replace(",", ".")) } });
      setDishId(null);
      toast.success("Geração enviada ao Tripo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar.");
    } finally {
      await qc.invalidateQueries({ queryKey: ["dish-models"] });
      setBusy(false);
    }
  }
  return (
    <DashboardShell name={restaurant.restaurant.name}>
      <h1>Modelos 3D</h1>
      {!data.connected && <p className="text-muted-foreground mt-4">Conexão Tripo pendente.</p>}
      {menu.dishes.length === 0 ? (
        <div className="py-12">
          <p className="mb-4 text-muted-foreground">Nenhum prato cadastrado.</p>
          <Button asChild>
            <Link to="/dishes">Cadastrar prato</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {menu.dishes.map((d) => {
            const jobs = data.jobs.filter((j) => j.dish_id === d.id);
            const job = jobs[0];
            const model = jobs.find((j) => j.model_url);
            const active = jobs.find((j) => ["submitting", "queued", "running"].includes(j.status));
            const pending = active?.id === job?.id && !job?.error_message;
            return (
              <article key={d.id} className="border border-border rounded-md overflow-hidden">
                {d.photo_url && (
                  <img
                    src={d.photo_url}
                    alt={d.name}
                    className="w-full aspect-[16/9] object-cover"
                  />
                )}
                <div className="p-5 space-y-4">
                  <h2>{d.name}</h2>
                  {job && (
                    <p className="text-sm text-muted-foreground">
                      {job.status === "success"
                        ? "Modelo pronto"
                        : pending
                          ? `Geração em andamento · ${job.progress}%`
                          : "Geração não concluída"}{" "}
                      · largura {job.width_cm} cm
                    </p>
                  )}
                  {job?.error_message && (
                    <p role="alert" className="text-sm text-destructive">
                      {job.error_message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {model && (
                      <Button variant="outline" onClick={() => setViewId(model.id)}>
                        <Box /> Ver em 3D / câmera
                      </Button>
                    )}
                    <Button
                      disabled={!data.connected || !d.photo_path || Boolean(active)}
                      onClick={() => {
                        setDishId(d.id);
                        setWidth(job ? String(job.width_cm) : "");
                      }}
                    >
                      <Sparkles /> {job ? "Gerar novamente" : "Gerar modelo 3D"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadId(d.id);
                        setWidth(job ? String(job.width_cm) : "");
                      }}
                    >
                      <Upload /> Enviar GLB (teste)
                    </Button>
                    {active?.provider_task_id && (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Atualizar geração"
                        title="Atualizar geração"
                        onClick={() => update(active.id)}
                      >
                        <RefreshCw />
                      </Button>
                    )}
                  </div>
                  {!d.photo_path && (
                    <p className="text-sm text-muted-foreground">Foto do prato pendente.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Dialog
        open={Boolean(dishId)}
        onOpenChange={(open) => {
          if (!open && !busy) setDishId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar {dish?.name} em 3D</DialogTitle>
            <DialogDescription>
              A foto será enviada ao Tripo. Esta geração consome créditos da sua conta Tripo.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="food-width">Largura real do prato / porção (cm)</label>
          <Input
            id="food-width"
            type="number"
            min="0.1"
            max="200"
            step="0.1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            O modelo é uma aproximação criada por IA. A largura informada calibra a escala; confira
            o resultado antes de apresentá-lo aos clientes.
          </p>
          <Button disabled={busy || Number(width) <= 0} onClick={submit}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />} Confirmar geração com
            Tripo
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(uploadDish)}
        onOpenChange={(open) => {
          if (!open && !uploading) setUploadId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar GLB para {uploadDish?.name}</DialogTitle>
            <DialogDescription>
              Use um modelo .glb de até 15 MB. O envio não consome créditos do Tripo.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitUpload}>
            <div className="space-y-2">
              <label htmlFor="glb-file">Arquivo .glb</label>
              <Input
                id="glb-file"
                name="file"
                type="file"
                accept=".glb,model/gltf-binary"
                required
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="glb-width">Largura real da porção (cm)</label>
              <Input
                id="glb-width"
                type="number"
                min="0.1"
                max="200"
                step="any"
                required
                value={width}
                disabled={uploading}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
              {uploading ? "Enviando…" : "Enviar e visualizar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(view)}
        onOpenChange={(open) => {
          if (!open) setViewId(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{menu.dishes.find((d) => d.id === view?.dish_id)?.name}</DialogTitle>
            <DialogDescription>
              Largura calibrada: {view?.width_cm} cm · realidade aumentada em celulares compatíveis.
            </DialogDescription>
          </DialogHeader>
          {view?.model_url && (
            <FoodModelViewer
              src={view.model_url}
              widthCm={Number(view.width_cm)}
              name={menu.dishes.find((d) => d.id === view.dish_id)?.name ?? "Prato"}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
