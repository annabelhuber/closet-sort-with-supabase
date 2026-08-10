"use client";

import { Input } from "@/components/ui/input";

type LocationInputProps = {
  id: string;
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
};

export function LocationInput({
  id,
  value,
  suggestions,
  onChange,
  onBlur,
  disabled,
}: LocationInputProps) {
  const listId = `${id}-suggestions`;
  const options = [...suggestions];
  const trimmed = value.trim();
  if (trimmed && !options.includes(trimmed)) {
    options.push(trimmed);
  }

  return (
    <>
      <Input
        id={id}
        list={listId}
        value={value}
        disabled={disabled}
        autoComplete="off"
        placeholder="e.g. Closet, Dresser, Storage"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <datalist id={listId}>
        {options.map((location) => (
          <option key={location} value={location} />
        ))}
      </datalist>
    </>
  );
}
