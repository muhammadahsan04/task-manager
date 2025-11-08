// import { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { logout } from '../../store/slices/authSlice';
// import NotificationBell from '../notifications/NotificationBell';
// import SearchModal from '../search/SearchModal';
// import ThemeToggle from './ThemeToggle';
// import { 
//   Menu, 
//   X, 
//   User, 
//   LogOut, 
//   Settings,
//   Users,
//   CheckSquare,
//   Home,
//   Calendar,
//   MessageSquare
// } from 'lucide-react';

// const Navbar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const dispatch = useDispatch();
//   const user = useSelector((s) => s.auth.user);

//   const handleLogout = async () => {
//     await dispatch(logout());
//     navigate('/login');
//   };

//   const navigationItems = [
//     { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: Home },
//     { id: 'teams', path: '/teams', label: 'Teams', icon: Users },
//     { id: 'tasks', path: '/tasks', label: 'Tasks', icon: CheckSquare },
//     { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar },
//     { id: 'reports', path: '/reports', label: 'Reports', icon: CheckSquare },
//   ];

//   // Special handling for chat - it uses dynamic route
//   const isChatPage = location.pathname.startsWith('/chat/');

//   const isCurrentPage = (path) => location.pathname === path;

//   // Cmd/Ctrl+K to open search
//   useEffect(() => {
//     const handler = (e) => {
//       const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
//       if (isCmdK) {
//         e.preventDefault();
//         setIsSearchOpen(true);
//       }
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, []);

//   return (
//     <nav className="bg-theme-primary shadow-theme-sm border-b border-theme-primary">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">
//           <div className="flex">
//             <div className="flex-shrink-0 flex items-center">
//               <h1 className="text-xl font-bold text-theme-primary">TaskManager</h1>
//             </div>
//             <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
//               {navigationItems.map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <button
//                     key={item.id}
//                     onClick={() => navigate(item.path)}
//                     className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
//                       isCurrentPage(item.path)
//                         ? 'border-accent-primary text-theme-primary'
//                         : 'border-transparent text-theme-secondary hover:border-theme-secondary hover:text-theme-primary'
//                     }`}
//                   >
//                     <Icon className="h-4 w-4 mr-2" />
//                     {item.label}
//                   </button>
//                 );
//               })}
//               <button
//                 onClick={() => navigate('/teams')}
//                 className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
//                   isChatPage
//                     ? 'border-accent-primary text-theme-primary'
//                     : 'border-transparent text-theme-secondary hover:border-theme-secondary hover:text-theme-primary'
//                 }`}
//                 title="Team Chat - Select a team to chat"
//               >
//                 <MessageSquare className="h-4 w-4 mr-2" />
//                 Chat
//               </button>
//             </div>
//           </div>

//           {/* Mobile menu button */}
//           <div className="sm:hidden flex items-center">
//             <button
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//               className="inline-flex items-center justify-center p-2 rounded-md text-theme-tertiary hover:text-theme-secondary hover:bg-theme-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-primary"
//             >
//               {isMenuOpen ? (
//                 <X className="block h-6 w-6" />
//               ) : (
//                 <Menu className="block h-6 w-6" />
//               )}
//             </button>
//           </div>

//           {/* Desktop profile menu */}
//           <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
//             {/* Search Button */}
//             <button
//               onClick={() => setIsSearchOpen(true)}
//               className="px-3 py-1 text-sm text-theme-secondary bg-theme-secondary hover:bg-theme-tertiary rounded"
//               aria-label="Open search (Ctrl/Cmd+K)"
//             >
//               Search
//             </button>

//             {/* Theme Toggle */}
//             <ThemeToggle />

//             {/* Notification Bell */}
//             <NotificationBell />

//             <div className="relative">
//               <button
//                 onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
//                 className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary"
//               >
//                 <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center">
//                   <User className="h-5 w-5 text-accent-primary" />
//                 </div>
//                 <span className="ml-2 text-theme-primary font-medium">{user?.name}</span>
//               </button>

//               {isProfileMenuOpen && (
//                 <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-theme-lg py-1 bg-theme-primary ring-1 ring-theme-primary focus:outline-none z-50">
//                   <div className="px-4 py-2 text-sm text-theme-primary border-b border-theme-primary">
//                     <div className="font-medium">{user?.name}</div>
//                     <div className="text-theme-secondary">{user?.email}</div>
//                   </div>
//                   <button
//                     onClick={() => navigate('/profile')}
//                     className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
//                   >
//                     <Settings className="h-4 w-4 mr-2" />
//                     Profile Settings
//                   </button>
//                   <button
//                     onClick={handleLogout}
//                     className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
//                   >
//                     <LogOut className="h-4 w-4 mr-2" />
//                     Sign out
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Mobile menu */}
//         {isMenuOpen && (
//           <div className="sm:hidden bg-theme-primary">
//             <div className="pt-2 pb-3 space-y-1">
//               {navigationItems.map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <button
//                     key={item.id}
//                     onClick={() => {
//                       navigate(item.path);
//                       setIsMenuOpen(false);
//                     }}
//                     className={`flex items-center w-full px-3 py-2 text-base font-medium rounded-md transition-colors ${
//                       isCurrentPage(item.path)
//                         ? 'bg-theme-secondary border-r-4 border-accent-primary text-accent-primary'
//                         : 'text-theme-secondary hover:bg-theme-secondary hover:text-theme-primary'
//                     }`}
//                   >
//                     <Icon className="h-5 w-5 mr-3" />
//                     {item.label}
//                   </button>
//                 );
//               })}
//               <button
//                 onClick={() => {
//                   navigate('/teams');
//                   setIsMenuOpen(false);
//                 }}
//                 className={`flex items-center w-full px-3 py-2 text-base font-medium rounded-md transition-colors ${
//                   isChatPage
//                     ? 'bg-theme-secondary border-r-4 border-accent-primary text-accent-primary'
//                     : 'text-theme-secondary hover:bg-theme-secondary hover:text-theme-primary'
//                 }`}
//               >
//                 <MessageSquare className="h-5 w-5 mr-3" />
//                 Chat
//               </button>
//             </div>
//             <div className="pt-4 pb-3 border-t border-theme-primary">
//               <div className="flex items-center px-3">
//                 <div className="h-10 w-10 rounded-full bg-theme-secondary flex items-center justify-center">
//                   <User className="h-6 w-6 text-accent-primary" />
//                 </div>
//                 <div className="ml-3">
//                   <div className="text-base font-medium text-theme-primary">{user?.name}</div>
//                   <div className="text-sm font-medium text-theme-secondary">{user?.email}</div>
//                 </div>
//               </div>
//               <div className="mt-3 space-y-1">
//                 <button
//                   onClick={() => {
//                     navigate('/profile');
//                     setIsMenuOpen(false);
//                   }}
//                   className="flex items-center w-full px-3 py-2 text-base font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary rounded-md"
//                 >
//                   <Settings className="h-5 w-5 mr-3" />
//                   Profile Settings
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="flex items-center w-full px-3 py-2 text-base font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary rounded-md"
//                 >
//                   <LogOut className="h-5 w-5 mr-3" />
//                   Sign out
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
//     </nav>
//   );
// };

// export default Navbar;


import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import NotificationBell from '../notifications/NotificationBell';
import SearchModal from '../search/SearchModal';
import ThemeToggle from './ThemeToggle';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Users,
  CheckSquare,
  Home,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const navigationItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: Home },
    { id: 'teams', path: '/teams', label: 'Teams', icon: Users },
    // { id: 'tasks', path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', path: '/reports', label: 'Reports', icon: CheckSquare },
  ];

  // Responsive overflow state for desktop nav
  const navContainerRef = useRef(null);
  const overflowButtonRef = useRef(null);
  const overflowMeasureRef = useRef(null);
  const itemMeasureRefs = useRef({});
  const [visibleIds, setVisibleIds] = useState(navigationItems.map(n => n.id));
  const [overflowIds, setOverflowIds] = useState([]);

  useEffect(() => {
    const getItemFullWidth = (el) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const marginLeft = parseFloat(styles.marginLeft) || 0;
      const marginRight = parseFloat(styles.marginRight) || 0;
      return rect.width + marginLeft + marginRight;
    };

    const computeLayout = () => {
      const container = navContainerRef.current;
      if (!container) return;

      const containerWidth = container.getBoundingClientRect().width;
      if (!containerWidth) return;

      // Measure all item widths
      const widths = navigationItems.map((item) => ({
        id: item.id,
        width: getItemFullWidth(itemMeasureRefs.current[item.id])
      }));

      // Read flex gap between nav items (Tailwind space-x-8)
      const containerStyles = window.getComputedStyle(container);
      const gap = parseFloat(containerStyles.columnGap || containerStyles.gap || '0') || 0;

      // Total width needed by all items, including the gaps between them
      const totalNeeded = widths.reduce((sum, w) => sum + (w.width || 0), 0) + gap * Math.max(0, widths.length - 1);

      // First pass: assume no overflow button
      if (totalNeeded <= containerWidth) {
        const allIds = navigationItems.map(n => n.id);
        // Avoid state churn
        setVisibleIds((prev) => (prev.join(',') === allIds.join(',') ? prev : allIds));
        setOverflowIds((prev) => (prev.length === 0 ? prev : []));
        return;
      }

      // If overflow is needed, reserve space for overflow trigger and recompute greedily.
      const measuredOverflowBtn = getItemFullWidth(overflowButtonRef.current) || getItemFullWidth(overflowMeasureRef.current);
      const overflowBtnWidth = measuredOverflowBtn || 72; // stable fallback
      const baseAvailable = Math.max(0, containerWidth - overflowBtnWidth);

      let used = 0;
      const nextVisible = [];
      const nextOverflow = [];
      for (let i = 0; i < widths.length; i++) {
        const w = widths[i];
        // width if we include this item next (include inter-item gap if not first)
        const projected = used + (nextVisible.length > 0 ? gap : 0) + (w.width || 0);
        // if at least one item will be visible, there will be a gap before the overflow trigger
        const gapBeforeOverflow = nextVisible.length > 0 ? gap : 0;
        // Check if including this item still keeps space for the overflow trigger (with its preceding gap if needed)
        if (projected + gapBeforeOverflow <= baseAvailable) {
          nextVisible.push(w.id);
          used = projected;
        } else {
          nextOverflow.push(w.id);
        }
      }
      setVisibleIds((prev) => (prev.join(',') === nextVisible.join(',') ? prev : nextVisible));
      setOverflowIds((prev) => (prev.join(',') === nextOverflow.join(',') ? prev : nextOverflow));
    };

    // Observe container size changes
    const ro = new ResizeObserver(() => {
      computeLayout();
    });
    if (navContainerRef.current) {
      ro.observe(navContainerRef.current);
    }
    // Recompute on window resize and route changes (label highlighting can affect width)
    window.addEventListener('resize', computeLayout);
    computeLayout();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeLayout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Special handling for chat - it uses dynamic route
  const isChatPage = location.pathname.startsWith('/chat/');

  const isCurrentPage = (path) => location.pathname === path;

  // Cmd/Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <nav className="bg-theme-primary shadow-theme-sm border-b border-theme-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex flex-1 min-w-0 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-theme-primary whitespace-nowrap">TaskManager</h1>
            </div>
            <div ref={navContainerRef} className="hidden sm:ml-6 h-16 sm:flex sm:flex-nowrap sm:items-stretch sm:space-x-8 relative overflow-visible min-w-0 max-w-full">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isVisible = visibleIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`${isVisible ? 'inline-flex' : 'hidden'
                      } items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isCurrentPage(item.path)
                        ? 'border-accent-primary text-theme-primary'
                        : 'border-transparent text-theme-secondary hover:border-theme-secondary hover:text-theme-primary'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}

              {/* Hidden measurement overflow button to stabilize width calculations */}
              <button
                ref={overflowMeasureRef}
                className="absolute opacity-0 pointer-events-none -z-10 items-center px-1 pt-1 border-b-2 text-sm font-medium"
                tabIndex={-1}
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4 mr-1" />
                More
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>

              {overflowIds.length > 0 && (
                <div className="relative flex items-center">
                  <button
                    ref={overflowButtonRef}
                    onClick={() => setIsOverflowOpen((v) => !v)}
                    className="inline-flex h-full items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-theme-secondary hover:text-theme-primary hover:border-theme-secondary"
                    aria-haspopup="menu"
                    aria-expanded={isOverflowOpen}
                    title="More"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-1" />
                    More
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                  {isOverflowOpen && (
                    <div className="origin-top-left absolute left-0 top-full mt-2 w-48 rounded-md shadow-theme-lg py-1 bg-theme-primary ring-1 ring-theme-primary focus:outline-none z-50">
                      {navigationItems.filter(i => overflowIds.includes(i.id)).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigate(item.path);
                              setIsOverflowOpen(false);
                            }}
                            className={`flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary ${isCurrentPage(item.path) ? 'font-medium text-accent-primary' : ''
                              }`}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hidden measurement container to get stable widths without affecting layout */}
            <div className="absolute opacity-0 pointer-events-none -z-10 whitespace-nowrap">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`measure-${item.id}`}
                    ref={(el) => { itemMeasureRefs.current[item.id] = el; }}
                    className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-theme-tertiary hover:text-theme-secondary hover:bg-theme-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-primary"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop profile menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4 shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3 py-1 text-sm text-theme-secondary bg-theme-secondary hover:bg-theme-tertiary rounded"
              aria-label="Open search (Ctrl/Cmd+K)"
            >
              Search
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary"
              >
                <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-accent-primary" />
                </div>
                <span className="ml-2 text-theme-primary font-medium">{user?.name}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-theme-lg py-1 bg-theme-primary ring-1 ring-theme-primary focus:outline-none z-50">
                  <div className="px-4 py-2 text-sm text-theme-primary border-b border-theme-primary">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-theme-secondary">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden bg-theme-primary">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-base font-medium rounded-md transition-colors ${isCurrentPage(item.path)
                        ? 'bg-theme-secondary border-r-4 border-accent-primary text-accent-primary'
                        : 'text-theme-secondary hover:bg-theme-secondary hover:text-theme-primary'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  navigate('/teams');
                  setIsMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 text-base font-medium rounded-md transition-colors ${isChatPage
                    ? 'bg-theme-secondary border-r-4 border-accent-primary text-accent-primary'
                    : 'text-theme-secondary hover:bg-theme-secondary hover:text-theme-primary'
                  }`}
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Chat
              </button>
            </div>
            <div className="pt-4 pb-3 border-t border-theme-primary">
              <div className="flex items-center px-3">
                <div className="h-10 w-10 rounded-full bg-theme-secondary flex items-center justify-center">
                  <User className="h-6 w-6 text-accent-primary" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-theme-primary">{user?.name}</div>
                  <div className="text-sm font-medium text-theme-secondary">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary rounded-md"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary rounded-md"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;
