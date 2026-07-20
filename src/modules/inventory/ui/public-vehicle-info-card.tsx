"use client";

import { useState } from "react";

type Props = {
  facts: string[];
  customNote?: string | null;
  hideHeading?: boolean;
};

export function PublicVehicleInfoCard({
  facts,
  customNote,
  hideHeading = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const note = customNote?.trim() || "";
  const needsExpand = note.length > 110 || note.split(/\n/).length > 2;

  if (facts.length === 0 && !note) return null;

  return (
    <section
      aria-labelledby={hideHeading ? undefined : "vehicle-info-heading"}
      className={
        hideHeading
          ? "mt-2"
          : "border border-border-subtle bg-surface-primary px-4 py-4 sm:px-5"
      }
    >
      {!hideHeading ? (
        <h2
          id="vehicle-info-heading"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary"
        >
          Información
        </h2>
      ) : null}
      {facts.length > 0 ? (
        <ul className={`${hideHeading ? "" : "mt-3"} space-y-1.5`}>
          {facts.map((fact) => (
            <li
              key={fact}
              className="flex items-start gap-2 text-sm text-text-primary"
            >
              <span aria-hidden="true" className="mt-0.5 text-brand-red">
                ✓
              </span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {note ? (
        <div
          className={
            facts.length > 0 && !hideHeading
              ? "mt-3 border-t border-border-subtle pt-3"
              : ""
          }
        >
          <p
            className={`text-sm leading-relaxed text-text-secondary ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {note}
          </p>
          {needsExpand ? (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-brand-red hover:underline"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? "Ver menos" : "Ver más"}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
