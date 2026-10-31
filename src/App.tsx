import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import SignIn, { ResetPassword } from "./pages/SignIn";
import PayCallback from "./pages/PayCallback";
import LawyerJoin from "./pages/LawyerJoin";
import Hire from "./pages/Hire";
import Lawyers from "./pages/Lawyers";
import LawyerProfile from "./pages/LawyerProfile";
import Book from "./pages/Book";
import Report from "./pages/Report";
import ReportSent from "./pages/ReportSent";
import Community from "./pages/Community";
import CommunityJoin from "./pages/CommunityJoin";
import MySpace from "./pages/MySpace";
import LawyerDashboard from "./pages/LawyerDashboard";
import Messages from "./pages/Messages";
import Session from "./pages/Session";
import HowItWorks from "./pages/HowItWorks";
import ForLawyers from "./pages/ForLawyers";
import { About, Safety, NotFound } from "./pages/Static";
import { TermsOfUse, PrivacyPolicy } from "./pages/Legal";
import Admin from "./pages/Admin";
import { AppStatus } from "./components/AppChrome";

export default function App() {
  return (
    <>
    <AppStatus />
    <Routes>
      <Route path="admin/*" element={<Admin />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="pay/callback" element={<PayCallback />} />
        <Route path="join/lawyer" element={<LawyerJoin />} />
        <Route path="hire" element={<Hire />} />
        <Route path="lawyers" element={<Lawyers />} />
        <Route path="lawyers/:id" element={<LawyerProfile />} />
        <Route path="book/:id" element={<Book />} />
        <Route path="report" element={<Report />} />
        <Route path="report/sent/:id" element={<ReportSent />} />
        <Route path="community" element={<Community />} />
        <Route path="community/join" element={<CommunityJoin />} />
        <Route path="me" element={<MySpace />} />
        <Route path="lawyer/dashboard" element={<LawyerDashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:threadId" element={<Messages />} />
        <Route path="session/:id" element={<Session />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="for-lawyers" element={<ForLawyers />} />
        <Route path="about" element={<About />} />
        <Route path="safety" element={<Safety />} />
        <Route path="terms" element={<TermsOfUse />} />
        <Route path="terms-of-use" element={<TermsOfUse />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  );
}
