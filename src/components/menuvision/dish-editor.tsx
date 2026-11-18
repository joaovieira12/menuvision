import { useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, LoaderCircle, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { saveDish, type getMenu } from '@/lib/menu.functions';
import { dishSchema, validatePhoto } from '@/lib/menu-schema';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
type Menu = Awaited<ReturnType<typeof getMenu>>;
export function DishEditor({ dish, categories, close }: { dish: Menu['dishes'][number] | null; categories: Menu['categories']; close: () => void }) {
  const save = useServerFn(saveDish); const client = useQueryClient();
  const [active, setActive] = useState(dish?.active ?? true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [file, setFile] = useState<File | null>(null); const [removePhoto, setRemovePhoto] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); const values = new FormData(e.currentTarget);
    const parsed = dishSchema.safeParse({ id: dish?.id, name: values.get('name'), description: values.get('description'), price: Number(String(values.get('price')).replace(',', '.')), category_id: values.get('category_id') || null, active, photo_path: removePhoto ? null : dish?.photo_path ?? null });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Confira os dados.'); return; }
    setBusy(true); let uploaded: string | null = null; let saved = false;
    try {
      if (file) {
        validatePhoto(file); const { data, error: authError } = await supabase.auth.getUser(); if (authError || !data.user) throw new Error('Entre novamente para enviar a foto.');
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
        uploaded = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
        const result = await supabase.storage.from('dish-photos').upload(uploaded, file, { contentType: file.type, upsert: false }); if (result.error) throw new Error('Não foi possível enviar a foto. Tente novamente.');
      }
      await save({ data: { ...parsed.data, photo_path: uploaded ?? parsed.data.photo_path } }); saved = true;
      if (dish?.photo_path && (uploaded || removePhoto)) await supabase.storage.from('dish-photos').remove([dish.photo_path]);
      await client.invalidateQueries({ queryKey: ['menu'] }); toast.success(dish ? 'Prato atualizado.' : 'Prato cadastrado.'); close();
    } catch (failure) { if (uploaded && !saved) await supabase.storage.from('dish-photos').remove([uploaded]); setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.'); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}><DialogContent className="editor-dialog" onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }}><DialogHeader><DialogTitle>{dish ? 'Editar prato' : 'Novo prato'}</DialogTitle><DialogDescription>{dish?.name ?? 'Seu próximo sabor.'}</DialogDescription></DialogHeader><form className="form-stack" onSubmit={submit}><div className="field"><label htmlFor="dish-name">Nome do prato</label><input id="dish-name" name="name" defaultValue={dish?.name} required minLength={2} maxLength={100}/></div><div className="field"><label htmlFor="dish-description">Descrição</label><textarea id="dish-description" name="description" rows={3} maxLength={1000} defaultValue={dish?.description ?? ''}/></div><div className="editor-columns"><div className="field"><label htmlFor="dish-price">Preço (R$)</label><input id="dish-price" name="price" type="number" step="0.01" min="0" max="99999999.99" required defaultValue={dish?.price}/></div><div className="field"><label htmlFor="dish-category">Categoria</label><select id="dish-category" name="category_id" defaultValue={dish?.category_id ?? ''}><option value="">Sem categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><div className="field"><label htmlFor="dish-photo"><ImagePlus size={16} className="inline mr-2"/>Fotografia</label>{dish?.photo_url && !removePhoto && !file && <img className="editor-photo" src={dish.photo_url} alt={dish.name}/>}<input id="dish-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const photo = e.target.files?.[0]; if (!photo) return; try { validatePhoto(photo); setFile(photo); setRemovePhoto(false); setError(''); } catch (failure) { e.target.value = ''; setError(failure instanceof Error ? failure.message : 'Foto inválida.'); } }}/>{(dish?.photo_path || file) && !removePhoto && <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setRemovePhoto(true); }}>Remover foto</Button>}</div><div className="flex items-center justify-between"><label htmlFor="dish-active" className="text-sm">Prato ativo</label><Switch id="dish-active" checked={active} onCheckedChange={setActive}/></div>{error && <p role="alert" className="form-message error">{error}</p>}<Button disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <Save/>}{busy ? 'Salvando…' : 'Salvar prato'}</Button></form></DialogContent></Dialog>;
}