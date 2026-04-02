'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input.tsx';

interface NumericInputProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}

/**
 * A text input for numeric values that uses a local draft state,
 * allowing users to type incomplete values like "-" or "0." without
 * the controlled value resetting mid-input.
 *
 * - Propagates `onChange(number)` only when the draft parses to a finite number.
 * - On blur with empty or invalid draft, calls `onChange(undefined)`.
 * - Syncs draft when `value` changes externally (e.g. preset applied).
 */
export function NumericInput({ value, onChange, placeholder, className, disabled, title }: NumericInputProps) {
  const [draft, setDraft] = useState(() => (value !== undefined ? String(value) : ''));
  const lastEmitted = useRef<number | undefined>(value);

  // Sync draft when parent changes value externally (not due to our own onChange)
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setDraft(value !== undefined ? String(value) : '');
      lastEmitted.current = value;
    }
  }, [value]);

  const handleChange = (str: string) => {
    setDraft(str);
    const num = parseFloat(str);
    if (isFinite(num)) {
      lastEmitted.current = num;
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (draft.trim() === '') {
      lastEmitted.current = undefined;
      onChange(undefined);
      return;
    }
    if (!isFinite(parseFloat(draft))) {
      // Revert draft to last known good value
      setDraft(value !== undefined ? String(value) : '');
    }
  };

  return (
    <Input
      type='text'
      inputMode='decimal'
      className={className}
      placeholder={placeholder}
      value={draft}
      disabled={disabled}
      title={title}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}
