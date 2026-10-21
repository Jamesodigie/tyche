import { Component, type ReactNode } from "react";

/** Catches render crashes so people see a friendly message instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error("Tyche crashed:", error);
  }
  reset = () => {
    try { localStorage.removeItem("tyche:v1"); } catch { /* noop */ }
    window.location.href = "/";
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FFFBF7", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ maxWidth: 420 }}>
          <img src="/tyche-mark.png" alt="Tyche" style={{ width: 72, margin: "0 auto" }} />
          <h1 style={{ color: "#2A1838", fontSize: 24, margin: "16px 0 8px" }}>Something went wrong, love</h1>
          <p style={{ color: "#5E268B", margin: 0 }}>Please reload. If it keeps happening, tap “Start fresh”.</p>
          <p style={{ background: "#FDEDEA", borderRadius: 14, padding: 12, fontSize: 13, color: "#2A1838", wordBreak: "break-word" }}>{String(this.state.error.message || this.state.error)}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => window.location.reload()} style={{ background: "#5E268B", color: "#fff", border: 0, borderRadius: 999, padding: "12px 20px", fontWeight: 600 }}>Reload</button>
            <button onClick={this.reset} style={{ background: "#EEE2F7", color: "#4C1E71", border: 0, borderRadius: 999, padding: "12px 20px", fontWeight: 600 }}>Start fresh</button>
          </div>
        </div>
      </div>
    );
  }
}
