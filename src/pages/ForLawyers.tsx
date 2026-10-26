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
        <div className="mt-4 flex flex-col justify-center gap-2 sm:mt-8 sm:flex-row sm:gap-3">
          <Button size="lg" variant="warm" to="/join/lawyer">Create a lawyer account <ArrowRight size={18} /></Button>
          <Button size="lg" variant="outline" to="/signin?as=lawyer">I already have one</Button>
        </div>
      </PageHero>
      <section className="mx-auto max-w-5xl px-4 sm:px-6"><div className="grid gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {[
          { i: Eye, t: "See the case before you commit", d: "Read anonymised reports and review uploaded evidence before you bid." },
          { i: Gavel, t: "Bid on cases you want", d: "Send an offer with your fee — or offer it free — plus a personal note." },
          { i: Wallet, t: "You set the price", d: "Separate consultation and booking fees. Free options for pro bono work." },
          { i: CalendarClock, t: "Your hours, your days", d: "Clients only book inside the availability you set." },
          { i: MessagesSquare, t: "Calls, chat & Meet built in", d: "Talk to clients inside Tyche. No sharing personal numbers." },
          { i: BadgeCheck, t: "Verified badge", d: "We check your enrolment so clients trust you from the first click." },
        ].map((x) => (
          <div key={x.t} className="flex items-start gap-3 rounded-3xl bg-white p-3.5 shadow-soft ring-1 ring-plum-100 sm:block sm:rounded-4xl sm:p-6">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-plum-100 text-plum-600 sm:h-12 sm:w-12 sm:rounded-2xl"><x.i size={18} /></span>
            <span className="block min-w-0">
              <span className="block font-display text-base font-semibold text-ink sm:mt-4 sm:text-xl">{x.t}</span>
              <span className="mt-0.5 block text-sm text-plum-700/80 sm:mt-1 sm:text-base">{x.d}</span>
            </span>
          </div>
        ))}
      </div></section>
      <section className="mx-auto mt-4 max-w-4xl px-4 sm:mt-16 sm:px-6">
        <div className="rounded-3xl bg-plum-700 p-4 text-white sm:rounded-5xl sm:p-10">
          <p className="font-script text-xl text-tangerine-200 sm:text-2xl">earnings calculator</p>
          <h2 className="font-display text-xl font-semibold sm:text-3xl">What could you earn on Tyche?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4">
            <label className="block text-sm">Your consultation fee (₦)<Input type="number" value={fee} onChange={(e) => setFee(+e.target.value)} className="mt-1.5 border-plum-500 bg-plum-600 text-white" /></label>
            <label className="block text-sm">Paid sessions per month<Input type="number" value={n} onChange={(e) => setN(+e.target.value)} className="mt-1.5 border-plum-500 bg-plum-600 text-white" /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-1 sm:mt-6">
            <div><p className="text-sm text-plum-200">You take home monthly</p><p className="font-display text-3xl font-semibold text-tangerine-200 sm:text-5xl">{naira(lawyerTake(fee * n))}</p></div>
            <p className="pb-2 text-sm text-plum-200">after Tyche's {TYCHE_FEE * 100}% service fee ({naira(fee * n * TYCHE_FEE)})</p>
          </div>
        </div>
      </section>
    </>
  );
}
