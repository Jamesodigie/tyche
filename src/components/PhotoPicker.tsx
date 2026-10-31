import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, cx } from "./ui";

/** Round profile-photo picker with a live preview. */
export function PhotoPicker({
  name,
  file,
  currentUrl,
  onPick,
  required,
  hint = "A clear photo of your face helps people trust you.",
  size = 88,
  className,
}: {
  name: string;
  file?: File | null;
  currentUrl?: string;
  onPick: (f: File) => void;
  required?: boolean;
  hint?: string;
  size?: number;
  className?: string;
}) {
  const [preview, setPreview] = useState<string | undefined>();
  useEffect(() => {
    if (!file) return setPreview(undefined);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const src = preview || currentUrl;
  return (
    <label className={cx("flex cursor-pointer items-center gap-4 rounded-3xl bg-cream p-3 sm:p-4", className)}>
      <span className="relative shrink-0">
        <Avatar name={name || "You"} src={src} size={size} hue={260} className="ring-2" />
        <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-plum-700 text-white ring-2 ring-white"><Camera size={15} /></span>
      </span>
      <span className="min-w-0 text-sm">
        <span className="block font-semibold text-ink">
          {src ? "Change photo" : "Add a profile photo"}
          {required && !src && <span className="ml-1 text-tangerine-600">(required)</span>}
        </span>
        <span className="block text-plum-500">{hint}</span>
      </span>
      <input
        type="file"
        accept="image/*"
        aria-label="Profile photo"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
