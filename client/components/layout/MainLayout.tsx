import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/context/SelectionContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { filters, updateFilters, reset } = useSelection();
  return (
    <div className="min-h-screen bg-[hsl(var(--bg-alt))]">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="font-semibold text-primary text-lg">Gas Turbine Supply Chain</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link to="/" className="text-foreground/80 hover:text-foreground">Dashboard</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Input placeholder="Search Vendors / Components" value={filters.searchQuery} onChange={(e) => updateFilters({ searchQuery: e.target.value })} className="w-64" />
            </div>
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t mt-8">
        <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Supply Chain Analytics Demo · Built with React + Tailwind · Risk colors: Low #12B76A, Moderate #F79009, High #F04438, Critical #B42318
        </div>
      </footer>
    </div>
  );
}
