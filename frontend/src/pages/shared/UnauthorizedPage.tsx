import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper-dim text-center">
      <h1 className="font-display text-3xl">Access denied</h1>
      <p className="text-ink/60">This role doesn't have access to that page.</p>
      <Link to="/login" className="text-seal hover:underline">Return to sign in</Link>
    </div>
  );
}
