import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/menuvision/auth-form';
import { pageHead } from '@/lib/metadata';
export const Route=createFileRoute('/cadastro')({head:()=>pageHead('Crie sua conta','Cadastre seu restaurante e comece sua jornada no MenuVision.'),component:()=> <AuthForm mode="signup"/>});
