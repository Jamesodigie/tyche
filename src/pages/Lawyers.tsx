import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LawyerCard } from "../components/LawyerCard";
import { Button, Chip, Empty, Input, PageHero, Select, cx } from "../components/ui";
import { KIND_COPY, PRACTICE_AREAS, type SessionKind } from "../lib/data";
import { useStore } from "../lib/store";

export default function Lawyers() {
  const { publicLawyers: lawyers } = useStore();
  const [params, setParams] = useSearchParams();
  const kind = (params.get("kind") as SessionKind) || "consultation";
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [state, setState] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

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
        <div className="mx-auto mt-3 inline-grid w-full max-w-xs grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-plum-100 sm:mt-6 sm:w-auto sm:max-w-none">
          {(["consultation", "booking"] as const).map((k) => (
            <button key={k} onClick={() => setParams({ kind: k })} className={cx("rounded-full px-5 py-2 text-sm font-semibold capitalize transition sm:px-6 sm:py-2.5", kind === k ? "bg-plum-600 text-white" : "text-plum-600")}>
              {k}
            </button>
          ))}
        </div>
      </PageHero>
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white p-2.5 shadow-soft ring-1 ring-plum-100 sm:gap-3 sm:rounded-4xl sm:p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative col-span-2 flex gap-2 md:col-span-1">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-300" size={18} />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, area or city" className="pl-11" />
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} aria-label="Filters" aria-expanded={showFilters} className={cx("grid w-12 shrink-0 place-items-center rounded-2xl ring-1 md:hidden", showFilters || area || state || sort !== "rating" ? "bg-plum-600 text-white ring-plum-600" : "bg-white text-plum-600 ring-plum-100")}>
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <Select value={area} onChange={(e) => setArea(e.target.value)} className={cx("col-span-2 md:col-span-1 md:block", !showFilters && "hidden")}>
            <option value="">All case types</option>
            {PRACTICE_AREAS.map((a) => <option key={a}>{a}</option>)}
          </Select>
          <Select value={state} onChange={(e) => setState(e.target.value)} className={cx("md:block", !showFilters && "hidden")}>
            <option value="">All states</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className={cx("md:block", !showFilters && "hidden")}>
            <option value="rating">Top rated</option>
            <option value="low">Lowest fee</option>
            <option value="new">Most recent call</option>
          </Select>
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <SlidersHorizontal size={16} className="hidden text-plum-400 md:block" />
          <Chip tone="teal" active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>Free {kind} only</Chip>
          {["Sexual harassment", "Workplace harassment", "Online & cyber harassment"].map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(area === a ? "" : a)}>{a}</Chip>
          ))}
          <span className="ml-auto shrink-0 whitespace-nowrap pl-2 text-sm text-plum-500">{list.length} lawyer{list.length === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-3 grid gap-3 sm:mt-6 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => <LawyerCard key={l.id} l={l} kind={kind} />)}
        </div>
        {!list.length && (
          <Empty icon={<SearchX />} title="No one matches that yet" sub="Try removing a filter — or share your report and let lawyers come to you." action={<Button to="/report">Share my report instead</Button>} />
        )}
      </section>
    </>
  );
}
