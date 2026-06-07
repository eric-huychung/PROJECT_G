/**
 * CSV drop zone for the landing page.
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";

type drop_zone_props = {
  file: File | null;
  on_file_change: (file: File | null) => void;
};

/**
 * @param props - Selected file and change handler
 */
export function DropZone({ file, on_file_change }: drop_zone_props) {
  const input_ref = useRef<HTMLInputElement>(null);
  const [is_dragging, set_is_dragging] = useState(false);

  const accept_file = useCallback(
    (next: File | null) => {
      if (!next) {
        on_file_change(null);
        return;
      }

      const is_csv =
        next.name.toLowerCase().endsWith(".csv") ||
        next.type === "text/csv" ||
        next.type === "application/vnd.ms-excel";

      if (!is_csv) {
        return;
      }

      on_file_change(next);
    },
    [on_file_change],
  );

  const handle_drop = (event: React.DragEvent) => {
    event.preventDefault();
    set_is_dragging(false);
    accept_file(event.dataTransfer.files.item(0));
  };

  const handle_drag_over = (event: React.DragEvent) => {
    event.preventDefault();
    set_is_dragging(true);
  };

  const handle_drag_leave = () => {
    set_is_dragging(false);
  };

  const handle_input_change = (event: React.ChangeEvent<HTMLInputElement>) => {
    accept_file(event.target.files?.item(0) ?? null);
    event.target.value = "";
  };

  if (file) {
    return (
      <div className="glass-field flex min-h-[120px] items-center justify-between gap-4 rounded-3xl px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <FileSpreadsheet className="h-7 w-7 shrink-0 text-g-red" />
          <div className="min-w-0 text-left">
            <p className="truncate text-lg font-medium text-g-ink">{file.name}</p>
            <p className="text-sm text-g-gray">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => on_file_change(null)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-g-gray transition-colors hover:bg-g-white/80 hover:text-g-ink"
          aria-label="Remove file"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input_ref.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          input_ref.current?.click();
        }
      }}
      onDrop={handle_drop}
      onDragOver={handle_drag_over}
      onDragLeave={handle_drag_leave}
      className={cn(
        "glass-field glass-field-interactive group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-3xl px-8 py-16 text-center sm:min-h-[220px]",
        is_dragging && "is-active",
      )}
    >
      <input
        ref={input_ref}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handle_input_change}
      />
      <Upload
        className="mb-4 h-8 w-8 text-g-gray transition-all duration-200 group-hover:scale-110 group-hover:text-g-navy"
        strokeWidth={1.25}
      />
      <p className="text-lg font-medium text-g-ink transition-colors duration-200 group-hover:text-g-navy">
        Drop CSV here
      </p>
      <p className="mt-1.5 text-sm text-g-gray transition-colors duration-200 group-hover:text-g-ink/70">
        or click to browse
      </p>
    </div>
  );
}
