import { Book, Search, User, Plus, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  const handleLogoClick = () => {
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Book className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="text-lg sm:text-2xl font-bold text-foreground">옆집책꽂이</span>
        </button>
        
        <div className="flex items-center gap-3">
          <Button variant="soft" size="sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">검색</span>
          </Button>
          <Button variant="warm" size="sm" onClick={() => navigate("/add-book")}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">책 등록</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleAuthClick}>
            {user ? <LogOut className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="hidden sm:inline">{user ? "로그아웃" : "로그인"}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-background/95 backdrop-blur">
          <div className="container py-4">
            <nav className="flex flex-col gap-3">
              <a 
                href="/books" 
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                책 찾기
              </a>
              <a 
                href="/my" 
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                내 책장
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;