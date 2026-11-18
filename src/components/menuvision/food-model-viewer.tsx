import { createElement, useEffect, useRef, useState } from 'react';
import { physicalScale } from '@/lib/models-schema';
import { Button } from '@/components/ui/button';
type ViewerElement = HTMLElement & { getDimensions:()=>{x:number;y:number;z:number}; scale:string; updateFraming:()=>Promise<void> };
export function FoodModelViewer({src,widthCm,name}:{src:string;widthCm:number;name:string}) {
  const ref=useRef<ViewerElement|null>(null);const [ready,setReady]=useState(false);const [error,setError]=useState(false);
  useEffect(()=>{let active=true;import('@google/model-viewer').then(()=>{if(active)setReady(true);}).catch(()=>setError(true));return()=>{active=false;};},[]);
  useEffect(()=>{
    const element=ref.current;if(!element)return;
    const loaded=()=>{const size=element.getDimensions();const scale=physicalScale(widthCm,size.x);element.scale=`${scale} ${scale} ${scale}`;void element.updateFraming();element.setAttribute('data-scene-ready','true');};
    const failed=()=>setError(true);element.addEventListener('load',loaded);element.addEventListener('error',failed);
    return()=>{element.removeEventListener('load',loaded);element.removeEventListener('error',failed);};
  },[ready,widthCm,src]);
  if(error)return <p role="alert">Não foi possível abrir o modelo 3D.</p>;
  if(!ready)return <p>Carregando modelo 3D…</p>;
  return createElement('model-viewer',{ref,src,alt:`Modelo 3D de ${name}`,'camera-controls':true,ar:true,'ar-modes':'webxr quick-look','ar-scale':'fixed','ar-placement':'floor','shadow-intensity':'1','touch-action':'pan-y',className:'relative block w-full h-[460px] bg-muted'},<Button slot="ar-button" className="absolute bottom-4 left-4">Ver na minha mesa</Button>);
}
