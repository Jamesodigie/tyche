import { ArrowRight, BadgeCheck, CalendarClock, Eye, Gavel, MessagesSquare, Wallet } from "lucide-react";
import { useState } from "react";
import { Button, Input, PageHero } from "../components/ui";
import { TYCHE_FEE, lawyerTake, naira } from "../lib/data";

export default function ForLawyers() {
  const [fee, setFee] = useState(20000);
  const [n, setN] = useState(12);
  return (
    <>
      <PageHero eyebrow="for counsel who care" title={<>Do meaningful work. <em className="font-normal text-plum-600">Get paid properly.</em></>} sub="Tyche brings you clients who need you — with their story and evidence ready — and handles scheduling, calls and payments.">
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="warm" to="/join/lawyer">Create a lawyer account <ArrowRight size={18} /></Button>
          <Button size="lg" variant="outline" to="/signin?as=lawyer">I already have one</Button>
        </div>
      </PageHero>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { i: Eye, t: "See the case before you commit", d: "Read anonymised reports and review uploaded evidence before you bid." },
          { i: Gavel, t: "Bid on cases you want", d: "Send an offer with your fee — or offer it free — plus a personal note." },
          { i: Wallet, t: "You set the price", d: "Separate consultation and booking fees. Free options for pro bono work." },
          { i: CalendarClock, t: "Your hours, your days", d: "Clients only book inside the availability you set." },
          { i: MessagesSquare, t: "Calls, chat & Meet built in", d: "Talk to clients inside Tyche. No sharing personal numbers." },
          { i: BadgeCheck, t: "Verified badge", d: "We check your enrolment so clients trust you from the first click." },
        ].map((x) => (
          <div key={x.t} className="rounded-4xl bg-white p-6 shadow-soft ring-1 ring-plum-100">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-100 text-plum-600"><x.i size={22} /></span>
            <p className="mt-4 font-display text-xl font-semibold text-ink">{x.t}</p>
            <p className="mt-1 text-plum-700/80">{x.d}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto mt-16 max-w-4xl px-5">
        <div className="rounded-5xl bg-plum-700 p-8 text-white sm:p-10">
          <p className="font-script text-2xl text-tangerine-200">earnings calculator</p>
          <h2 className="font-display text-3xl font-semibold">What could you earn on Tyche?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">Your consultation fee (₦)<Input type="number" value={fee} onChange={(e) => setFee(+e.target.value)} className="mt-1.5 border-plum-500 bg-plum-600 text-white" /></label>
            <label className="block text-sm">Paid sessions per month<Input type="number" value={n} onChange={(e) => setN(+e.target.value)} className="mt-1.5 border-plum-500 bg-plum-600 text-white" /></label>
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-6">
            <div><p className="text-sm text-plum-200">You take home monthly</p><p className="font-display text-5xl font-semibold text-tangerine-200">{naira(lawyerTake(fee * n))}</p></div>
            <p className="pb-2 text-sm text-plum-200">after Tyche's {TYCHE_FEE * 100}% service fee ({naira(fee * n * TYCHE_FEE)})</p>
          </div>
        </div>
      </section>
    </>
  );
}
