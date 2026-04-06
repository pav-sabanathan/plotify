import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import plotifyLogo from '@/assets/plotify-logo-full.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, setShowAuthModal, setAuthModalView } = useAuth();

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative flex justify-center items-center py-1.5 md:py-6">
      <img
        src={plotifyLogo}
        alt="Plotify"
        className="w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/home')}
      />

      {user ? (
        <div className="absolute right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 focus:outline-none" aria-label="Profile menu">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{profile?.display_name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <button
          onClick={() => navigate('/settings')}
          className="absolute right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default AppHeader;
