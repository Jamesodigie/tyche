import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LawyerCard } from "../components/LawyerCard";
import { Button, Chip, Empty, Input, PageHero, Select, cx } from "../components/ui";
import { KIND_COPY, PRACTICE_AREAS, type SessionKind } from "../lib/data";
import { useStore } from "../lib/store";

export default function Lawyers() {
  const { lawyers } = useStore();
  const [params, setParams] = useSearchParams();
  const kind = (params.get("kind") as SessionKind) || "consultation";
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [state, setState] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("rating");

  const fee = (l: (typeof lawyers)[number]) => (kind === "consultation" ? (l.consultFree ? 0 : l.consultFee) : l.bookingFree ? 0 : l.bookingFee);
  const states = [...new Set(lawyers.map((l) => l.state))].sort();

  const list = useMemo(() => {
    let r = lawyers.filter(
      (l) =>
        (!q || (l.name + l.areas.join(" ") + l.city + l.state).toLowerCase().includes(q.toLowerCase())) &&
        (!area || l.areas.includes(area)) &&
        (!state || l.state === state) &&
        (!freeOnly || fee(l) === 0),
    );
    r = [...r].sort((a, b) => (sort === "rating" ? b.rating - a.rating : sort === "low" ? fee(a) - fee(b) : b.yearCalled - a.yearCalled));
    return r;
  }, [lawyers, q, area, state, freeOnly, sort, kind]);

  return (
    <>
      <PageHero eyebrow="verified, kind, on your side" title={<>Find a lawyer for a <em className="font-normal text-plum-600">{kind}</em></>} sub={KIND_COPY[kind].blurb}>
        <div className="mx-auto mt-6 inline-grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-plum-100">
          {(["consultation", "booking"] as const).map((k) => (
            <button key={k} onClick={() => setParams({ kind: k })} className={cx("rounded-full px-6 py-2.5 text-sm font-semibold capitalize transition", kind === k ? "bg-plum-600 text-white" : "text-plum-600")}>
              {k}
            </button>
          ))}
        </div>
      </PageHero>
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-3 rounded-4xl bg-white p-4 shadow-soft ring-1 ring-plum-100 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-300" size={18} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, area or city" className="pl-11" />
          </div>
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All case types</option>
            {PRACTICE_AREAS.map((a) => <option key={a}>{a}</option>)}
          </Select>
          <Select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Anywhere in Nigeria</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="low">Lowest fee</option>
            <option value="new">Most recent call</option>
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={16} className="text-plum-400" />
          <Chip tone="teal" active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>Free {kind} only</Chip>
          {["Sexual harassment", "Workplace harassment", "Online & cyber harassment"].map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(area === a ? "" : a)}>{a}</Chip>
          ))}
          <span className="ml-auto text-sm text-plum-500">{list.length} lawyer{list.length === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => <LawyerCard key={l.id} l={l} kind={kind} />)}
        </div>
        {!list.length && (
          <Empty icon={<SearchX />} title="No one matches that yet" sub="Try removing a filter — or share your report and let lawyers come to you." action={<Button to="/report">Share my report instead</Button>} />
        )}
      </section>
    </>
  );
}
