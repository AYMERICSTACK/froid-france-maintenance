"use client";

import { useState } from "react";

const items = [
  "Nettoyage filtres",
  "Vérification pression",
  "Contrôle unité intérieure",
  "Contrôle unité extérieure",
];

export default function InterventionChecklist({
  onChange,
}: {
  onChange: (values: string[]) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);

  function toggle(item: string) {
    const updated = checked.includes(item)
      ? checked.filter((i) => i !== item)
      : [...checked, item];

    setChecked(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked.includes(item)}
            onChange={() => toggle(item)}
          />
          {item}
        </label>
      ))}
    </div>
  );
}
