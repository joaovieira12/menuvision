import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from './brand';
import { useSessionUser } from './session';
export function SiteHeader() {
 const user = useSessionUser(); const [open,setOpen] = useState(false);
 return <><header className="site-header wrap"><Brand/><nav className="nav-links desktop-nav" aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#beneficios">Benefícios</a><a href="#planos">Planos</a><a href="#duvidas">Dúvidas</a></nav><div className="header-actions"><Button variant="ghost" asChild><Link to={user ? '/dashboard' : '/auth'}>{user ? 'Meu painel' : 'Entrar'}</Link></Button><Button className="header-start" asChild><Link to="/cadastro">Começar agora <ArrowUpRight/></Link></Button><Button className="mobile-nav" variant="ghost" size="icon" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={()=>setOpen(!open)}>{open ? <X/> : <Menu/>}</Button></div></header>{open && <nav className="wrap flex flex-wrap gap-5 py-5 text-sm text-muted-foreground" aria-label="Menu móvel"><a href="#como-funciona" onClick={()=>setOpen(false)}>Como funciona</a><a href="#planos" onClick={()=>setOpen(false)}>Planos</a><a href="#duvidas" onClick={()=>setOpen(false)}>Dúvidas</a></nav>}</>;
}
