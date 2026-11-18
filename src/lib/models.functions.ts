import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { generateModelSchema, parseModelUpload, isGlb } from './models-schema';
import { idSchema } from './menu-schema';
export const getModels = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('dish_model_jobs').select('*').eq('owner_id',context.userId).order('created_at',{ascending:false});
  if (error) throw new Error('Não foi possível carregar seus modelos.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const jobs = await Promise.all((data ?? []).map(async job => {
    const signed = job.model_path ? await supabaseAdmin.storage.from('dish-models').createSignedUrl(job.model_path,3600) : null;
    return { ...job, model_url: signed?.data?.signedUrl ?? null };
  }));
  return { jobs, connected: Boolean(process.env['LOVABLE_API_KEY'] && process.env['UDC_TRIPO_API_KEY']) };
});
export const generateModel = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>generateModelSchema.parse(input)).handler(async ({data,context})=>{
  const apiKey=process.env['LOVABLE_API_KEY']; const connection=process.env['UDC_TRIPO_API_KEY'];
  if(!apiKey || !connection) throw new Error('Conecte Tripo antes de gerar modelos.');
  const {data:dish}=await context.supabase.from('dishes').select('*').eq('id',data.dishId).eq('owner_id',context.userId).single();
  if(!dish?.photo_path) throw new Error('Cadastre uma foto deste prato antes de gerar o modelo.');
  const signed=await context.supabase.storage.from('dish-photos').createSignedUrl(dish.photo_path,3600);
  if(!signed.data) throw new Error('Foto indisponível.');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const inserted=await supabaseAdmin.from('dish_model_jobs').insert({dish_id:dish.id,restaurant_id:dish.restaurant_id,owner_id:context.userId,width_cm:data.widthCm}).select('id').single();
  if(!inserted.data) throw new Error('Já existe uma geração em andamento para este prato.');
  const {tripoRequest}=await import('./tripo.server');
  try {
    const task=await tripoRequest('/generation/image-to-model',apiKey,connection,{input:signed.data.signedUrl,model:'v3.1-20260211',face_limit:20000,texture:true,pbr:true,auto_size:false});
    const {error}=await supabaseAdmin.from('dish_model_jobs').update({provider_task_id:task.task_id,status:'queued'}).eq('id',inserted.data.id);
    if(error) throw new Error('Geração enviada; não foi possível salvar o identificador. Não envie novamente.');
  } catch(e) {
    // Keep submitting on ambiguous network errors to avoid duplicate paid generations.
    await supabaseAdmin.from('dish_model_jobs').update({error_message:e instanceof Error?e.message:'Falha ao enviar. Confira Tripo antes de tentar novamente.'}).eq('id',inserted.data.id);
    throw e;
  }
  return {id:inserted.data.id};
});
export const refreshModel = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>idSchema.parse(input)).handler(async ({data,context})=>{
  const {data:job}=await context.supabase.from('dish_model_jobs').select('*').eq('id',data.id).eq('owner_id',context.userId).single();
  if(!job?.provider_task_id || job.model_path) return {ok:true};
  const apiKey=process.env['LOVABLE_API_KEY'];const connection=process.env['UDC_TRIPO_API_KEY'];
  if(!apiKey || !connection) throw new Error('Tripo não conectado.');
  const {tripoRequest}=await import('./tripo.server');
  const task=await tripoRequest(`/tasks/${encodeURIComponent(job.provider_task_id)}`,apiKey,connection);
  const status=['queued','running','success','failed','cancelled','banned','expired'].includes(task.status)?task.status:'running';
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  let modelPath: string | null=null;
  if(status==='success') {
    const url=new URL(task.output?.model_url ?? '');
    if(url.protocol!=='https:' || !/(^|\.)(tripo3d\.ai|tripo-data\.com)$/.test(url.hostname)) throw new Error('Endereço de modelo Tripo não reconhecido.');
    const response=await fetch(url,{redirect:'error'});
    if(!response.ok) throw new Error('Não foi possível baixar o modelo Tripo.');
    const buffer=await response.arrayBuffer();
    if(buffer.byteLength>50*1024*1024 || buffer.byteLength<12 || new DataView(buffer).getUint32(0,true)!==0x46546c67) throw new Error('Modelo GLB inválido ou maior que 50 MB.');
    modelPath=`${context.userId}/${job.id}.glb`;
    const upload=await supabaseAdmin.storage.from('dish-models').upload(modelPath,buffer,{contentType:'model/gltf-binary',upsert:true});
    if(upload.error) throw new Error('Não foi possível guardar o modelo.');
  }
  const {error}=await supabaseAdmin.from('dish_model_jobs').update({status,progress:Math.min(100,Math.max(0,Number(task.progress)||0)),...(modelPath?{model_path:modelPath}:{}),error_message:['failed','banned','expired','cancelled'].includes(status)?'A geração não foi concluída pelo Tripo.':null}).eq('id',job.id);
  if(error) throw new Error('Não foi possível atualizar o modelo.');
  return {ok:true};
});
// Testing only: lets owners attach a GLB made elsewhere, without spending provider credits.
export const uploadTestModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseModelUpload)
  .handler(async ({ data, context }) => {
    const { data: dish } = await context.supabase
      .from("dishes")
      .select("id,restaurant_id")
      .eq("id", data.dishId)
      .eq("owner_id", context.userId)
      .single();
    if (!dish) throw new Error("Prato não encontrado.");
    const bytes = new Uint8Array(await data.file.arrayBuffer());
    if (!isGlb(bytes)) throw new Error("Envie um arquivo GLB válido de até 15 MB.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const modelPath = `${context.userId}/${id}.glb`;
    const upload = await supabaseAdmin.storage
      .from("dish-models")
      .upload(modelPath, bytes, { contentType: "model/gltf-binary", upsert: false });
    if (upload.error) {
      if (/bucket not found/i.test(upload.error.message)) {
        throw new Error("O armazenamento privado dish-models precisa ser configurado no Supabase.");
      }
      throw new Error("Não foi possível guardar o modelo.");
    }
    const { error } = await supabaseAdmin
      .from("dish_model_jobs")
      .insert({
        id,
        dish_id: dish.id,
        restaurant_id: dish.restaurant_id,
        owner_id: context.userId,
        width_cm: data.widthCm,
        status: "success",
        progress: 100,
        model_path: modelPath,
      });
    if (error) {
      await supabaseAdmin.storage.from("dish-models").remove([modelPath]);
      throw new Error("Não foi possível salvar o modelo.");
    }
    return { id };
  });
