import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/menuvision/auth-form';
import { pageHead } from '@/lib/metadata';
export const Route=createFileRoute('/forgot-password')({head:()=>pageHead('Recuperar senha','Recupere o acesso à sua conta MenuVision por e-mail.'),component:()=> <AuthForm mode="forgot"/>});
