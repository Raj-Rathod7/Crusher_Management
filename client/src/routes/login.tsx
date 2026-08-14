import { useAuth } from '#/lib/auth-context';
import { LoginForm } from '@/components/login-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GalleryVerticalEnd, LoaderCircle } from "lucide-react";
import { useEffect } from 'react';

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const {isAuthenticated, isChecking} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Vaibhav Stone Crusher
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
