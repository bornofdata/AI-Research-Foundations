import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Heart } from 'lucide-react';

export const SignInPage: React.FC = () => (
  <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 gap-8">
    {/* Brand */}
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
        <Heart className="w-8 h-8 text-on-primary" />
      </div>
      <h1 className="text-2xl font-bold text-on-surface">CareConnect</h1>
      <p className="text-sm text-on-surface-variant max-w-xs">
        Your secure patient portal — sign in to access your health records and AI assistant.
      </p>
    </div>

    {/* Clerk sign-in widget */}
    <SignIn
      appearance={{
        elements: {
          rootBox: 'w-full max-w-sm',
          card: 'shadow-xl rounded-2xl border border-outline-variant bg-surface-container-lowest',
          headerTitle: 'text-on-surface font-bold',
          headerSubtitle: 'text-on-surface-variant',
          formButtonPrimary:
            'bg-primary hover:bg-primary/90 text-on-primary rounded-full font-semibold',
          footerActionLink: 'text-primary font-semibold',
        },
      }}
    />
  </div>
);
