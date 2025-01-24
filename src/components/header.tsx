import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">
            <span className="gradient-text">Training</span> Trak
          </span>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="#features">Features</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#">Documentation</a>
          </Button>
          <Button size="sm" asChild>
            <a href="#">Sign In</a>
          </Button>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="md:hidden">
            Menu
          </Button>
        </div>
      </div>
    </header>
  );
}
