import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import SubjectManager from "./pages/SubjectManager";
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import ExamPredictor from "./pages/ExamPredictor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/subjects" element={<SubjectManager />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/focus" element={<FocusSession />} />
          <Route path="/exam-predictor" element={<ExamPredictor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
