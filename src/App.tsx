import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Profile } from './components/Profile';
import { Dashboard } from './components/Dashboard';
import { UserProfile } from './types';
import { Sprout } from 'lucide-react';

type ActiveView = 'login' | 'signup' | 'profile' | 'dashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('farmer_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('farmer_username'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ActiveView>('login');
  const [initializing, setInitializing] = useState(true);

  // Initialize and verify session on load
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setCurrentView('login');
        setInitializing(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
          setProfile(data.profile);
          
          // If the profile hasn't been completed yet, force completion first
          if (!data.profile || !data.profile.name) {
            setCurrentView('profile');
          } else {
            setCurrentView('dashboard');
          }
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        // Fallback to offline local storage state if server has issues
        if (username) {
          setCurrentView('dashboard');
        } else {
          handleLogout();
        }
      } finally {
        setInitializing(false);
      }
    };

    verifySession();
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUsername: string, userProfile: UserProfile) => {
    localStorage.setItem('farmer_token', newToken);
    localStorage.setItem('farmer_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
    setProfile(userProfile);

    // Route based on whether profile details are completed
    if (!userProfile || !userProfile.name) {
      setCurrentView('profile');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farmer_token');
    localStorage.removeItem('farmer_username');
    setToken(null);
    setUsername(null);
    setProfile(null);
    setCurrentView('login');
  };

  const handleProfileSaveSuccess = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setCurrentView('dashboard');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <Sprout className="absolute text-emerald-400 animate-pulse" size={24} />
        </div>
        <div className="text-center">
          <h2 className="text-white font-display font-extrabold text-lg tracking-wider">OptiCrop AI</h2>
          <p className="text-xs text-zinc-500 mt-1">Booting Smart Agricultural Production Optimization Engine...</p>
        </div>
      </div>
    );
  }

  // Render view based on state
  switch (currentView) {
    case 'login':
      return (
        <Login 
          onSuccess={handleAuthSuccess}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
      );
    case 'signup':
      return (
        <Signup 
          onSuccess={handleAuthSuccess}
          onNavigateToLogin={() => setCurrentView('login')}
        />
      );
    case 'profile':
      return (
        <Profile 
          initialProfile={profile || {
            name: '',
            email: '',
            state: '',
            district: '',
            village: '',
            phone: '',
            pincode: ''
          }}
          token={token || ''}
          onSaveSuccess={handleProfileSaveSuccess}
          onClose={profile?.name ? () => setCurrentView('dashboard') : undefined}
        />
      );
    case 'dashboard':
      return (
        <Dashboard 
          token={token || ''}
          username={username || ''}
          profile={profile || {
            name: '',
            email: '',
            state: '',
            district: '',
            village: '',
            phone: '',
            pincode: ''
          }}
          onLogout={handleLogout}
          onEditProfile={() => setCurrentView('profile')}
        />
      );
    default:
      return (
        <Login 
          onSuccess={handleAuthSuccess}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
      );
  }
}
