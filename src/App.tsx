import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import BooksWithMap from "./pages/BooksWithMap";
import BookDetail from "./pages/BookDetail";
import BookReview from "./pages/BookReview";
import PopularReviews from "./pages/PopularReviews";
import AddBook from "./pages/AddBook";
import MyPage from "./pages/MyPage";
import ReturnProof from "./pages/ReturnProof";
import RentalRestriction from "./pages/RentalRestriction";
import RewardNotification from "./pages/RewardNotification";

import EditBook from "./pages/EditBook";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TransactionConfirm from "./pages/TransactionConfirm";
import ReturnRequest from "./pages/ReturnRequest";
import ReturnComplete from "./pages/ReturnComplete";
import RentalConfirm from "./pages/RentalConfirm";
import ContractDetail from "./pages/ContractDetail";
import { BookRedirect } from "./components/BookRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/books" element={<BooksWithMap />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/book/:id" element={<BookRedirect />} />
            <Route path="/books/:bookId/review" element={<BookReview />} />
            <Route path="/reviews" element={<PopularReviews />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/my" element={<MyPage />} />
            <Route path="/return-proof/:transactionId" element={<ReturnProof />} />
            <Route path="/rental-restriction" element={<RentalRestriction />} />
            <Route path="/rewards" element={<RewardNotification />} />

            <Route path="/edit-book/:id" element={<EditBook />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/transaction-confirm/:id" element={<TransactionConfirm />} />
            <Route path="/return-request/:id" element={<ReturnRequest />} />
            <Route path="/return-complete/:id" element={<ReturnComplete />} />
          <Route path="/rental/confirm/:transactionId" element={<RentalConfirm />} />
          <Route path="/contracts/:contractId" element={<ContractDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
