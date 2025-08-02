import { Book, Search, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Book className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">이웃책꽂이</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            홈
          </a>
          <a href="/books" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            책 찾기
          </a>
          <a href="/community" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            독후감
          </a>
          <a href="/my" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            내 책장
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="soft" size="sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">검색</span>
          </Button>
          <Button variant="warm" size="sm">
            <Plus className="h-4 w-4" />
            책 등록
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;