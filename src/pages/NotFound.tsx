import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Compass className="h-12 w-12 text-slate-600" />
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-1 text-sm text-slate-400">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}
