'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface OtpInputHandle {
  focusFirst: () => void;
  clear: () => void;
}


interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  {
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false,
    hasError = false,
    autoFocus = true,
  },
  ref
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into an array of individual digits
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useImperativeHandle(ref, () => ({
    focusFirst: () => {
      inputRefs.current[0]?.focus();
    },
    clear: () => {
      onChange('');
      inputRefs.current[0]?.focus();
    },
  }));

  useEffect(() => {
    if (autoFocus && !disabled) {
      // Find first empty input or default to index 0
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }
  }, []); // Run once on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');

    if (!cleanDigits) {
      // Input was cleared
      const nextDigits = [...digits];
      nextDigits[index] = '';
      const nextVal = nextDigits.join('');
      onChange(nextVal);
      return;
    }

    // If multiple digits were pasted/autofilled into a single box
    if (cleanDigits.length > 1) {
      handlePastedDigits(cleanDigits, index);
      return;
    }

    // Single digit input
    const singleDigit = cleanDigits.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = singleDigit;
    const nextVal = nextDigits.join('');
    onChange(nextVal);

    // Advance focus to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is fully entered (all boxes filled)
    if (nextVal.length === length && !nextDigits.some((d) => !d)) {
      onComplete(nextVal);
    }
  };

  const handlePastedDigits = (pasted: string, startIndex = 0) => {
    const nextDigits = [...digits];
    for (let i = 0; i < pasted.length && startIndex + i < length; i++) {
      nextDigits[startIndex + i] = pasted[i];
    }
    const nextVal = nextDigits.join('');
    onChange(nextVal);

    const filledCount = nextDigits.filter(Boolean).length;
    if (filledCount === length) {
      inputRefs.current[length - 1]?.focus();
      onComplete(nextVal);
    } else {
      const nextEmpty = nextDigits.findIndex((d) => !d);
      inputRefs.current[nextEmpty === -1 ? length - 1 : nextEmpty]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current box without moving
        e.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index] = '';
        onChange(nextDigits.join(''));
      } else if (index > 0) {
        // Move to previous box and clear it
        e.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        onChange(nextDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      if (index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const nextDigits = [...digits];
      nextDigits[index] = '';
      onChange(nextDigits.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasteData) {
      handlePastedDigits(pasteData, index);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);
        const isMiddle = length === 6 && index === 2;

        return (
          <React.Fragment key={index}>
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={(e) => handlePaste(e, index)}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${index + 1} of ${length}`}
              className={`
                w-10 h-12 sm:w-12 sm:h-14
                text-center text-xl sm:text-2xl font-mono font-bold
                rounded-xl outline-none select-none transition-all duration-150
                bg-zinc-900 text-white
                ${
                  hasError
                    ? 'border-2 border-red-500 text-red-300 ring-2 ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    : isFilled
                    ? 'border-2 border-orange-500/80 bg-orange-950/20 text-orange-400'
                    : 'border-2 border-zinc-700 hover:border-zinc-500'
                }
                focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 focus:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-700
              `}
            />
            {isMiddle && (
              <span className="text-zinc-600 font-bold select-none text-lg px-0.5 sm:px-1">
                •
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});
