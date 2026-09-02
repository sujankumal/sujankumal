'use client';

import { useState } from 'react';
import { MfaSettingsModal } from './MfaSettingsModal';

export function AdminSecurityButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex w-fit items-center justify-center rounded-md bg-stone-900 border border-stone-700 px-4 py-2 text-sm text-white hover:bg-stone-800 transition-colors shadow-sm cursor-pointer"
        type="button"
      >
        <span className="mr-2">🛡️</span> Security & 2FA
      </button>
      <MfaSettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
