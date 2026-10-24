import { FileAudio, FileText, FileVideo, ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { prettySize, type Evidence } from "../lib/data";
import { useStore } from "../lib/store";

const kindIcon = { image: ImageIcon, audio: FileAudio, video: FileVideo, doc: FileText };

/** A file pill that opens the evidence through a short-lived private link. */
export function EvidenceChip({ e }: { e: Evidence }) {
  const { evidenceUrl } = useStore();
  const [busy, setBusy] = useState(false);
  const I = kindIcon[e.kind] || FileText;
  const open = async () => {
    setBusy(true);
    // Open the tab first so pop-up blockers allow it, then point it at the signed URL.
    const w = window.open("", "_blank", "noopener");
    const url = await evidenceUrl(e);
    setBusy(false);
    if (url && w) w.location.href = url;
    else if (url) window.location.assign(url);
    else w?.close();
  };
  const clickable = !!(e.path || e.preview);
  return (
    <button
      type="button"
      onClick={clickable ? open : undefined}
      disabled={!clickable}
      title={clickable ? "Open file" : undefined}
      className="flex min-h-[40px] items-center gap-2 rounded-2xl bg-cream px-3 py-2 text-left text-xs transition enabled:hover:bg-plum-50 disabled:cursor-default"
    >
      {busy ? <Loader2 size={16} className="animate-spin text-plum-500" /> : e.preview ? <img src={e.preview} alt="" className="h-7 w-7 rounded-lg object-cover" /> : <I size={16} className="text-plum-500" />}
      <span className="max-w-[160px] truncate font-medium text-ink">{e.name}</span>
      <span className="text-plum-400">{prettySize(e.size)}</span>
    </button>
  );
}
