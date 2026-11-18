import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/menuvision/auth-form';
import { pageHead } from '@/lib/metadata';
export const Route=createFileRoute('/auth')({head:()=>pageHead('Entrar','Acesse a conta do seu restaurante no MenuVision.'),component:()=> <AuthForm mode="login"/>});
