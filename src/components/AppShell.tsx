import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { label: 'Subjects', path: '/subjects', icon: BookOpen },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Exam Predictor', path: '/exam-predictor', icon: Sparkles },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const logout = async () => {
    await signOut();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg font-bold gradient-text cursor-pointer" onClick={() => navigate('/dashboard')}>EduGenie</span>
            <div className="flex items-center gap-1">
              {navItems.map(item => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="text-sm"
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {session.user.email}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
