import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/menuvision/auth-form';
import { pageHead } from '@/lib/metadata';
export const Route=createFileRoute('/reset-password')({head:()=>pageHead('Nova senha','Defina uma nova senha para sua conta MenuVision.'),component:()=> <AuthForm mode="reset"/>});
