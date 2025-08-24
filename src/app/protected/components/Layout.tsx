"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import SettingsIcon from '@mui/icons-material/Settings';
import Logo from "./Logo";
import Icon from "./Icon";
import Image from "next/image";
import { useEffect, useState, useCallback, memo, useRef } from "react";
import { User } from "firebase/auth";
import { db } from "../../firebase";
import { collection, doc, query, where, getDocs, getDoc, collectionGroup, orderBy } from "firebase/firestore";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { checkIsAdmin } from "../../admin/utils/adminAuth";
import AdminAccess from "./AdminAccess";


interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout = memo(({ children, user, onLogout }: LayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeProjectsCount, setActiveProjectsCount] = useState<number | null>(null);
  const [followUpNotesCount, setFollowUpNotesCount] = useState<number | null>(null);
  const [teamMembersCount, setTeamMembersCount] = useState<number | null>(null);
  const [overdueNotesCount, setOverdueNotesCount] = useState<number>(0);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  
  // Use project filter context
  const { 
    selectedProject, 
    setSelectedProject, 
    projects, 
    projectsLoading 
  } = useProjectFilter();

  const handleNavigation = useCallback((href: string) => {
    setNavigating(href);
    router.prefetch(href);
    setTimeout(() => {
      router.push(href);
      setNavigating(null);
    }, 100);
  }, [router]);

  const fetchActiveProjectsCount = useCallback(async () => {
    if (!user || !db) return;
    try {
      // Check if user is admin first
      const isAdmin = await checkIsAdmin(user);
      
      if (isAdmin) {
        // Admin users can see all active projects across all organizations
        const allProjectsQuery = query(collectionGroup(db!, "projects"), where("status", "==", "Active"));
        const allProjectsSnapshot = await getDocs(allProjectsQuery);
        setActiveProjectsCount(allProjectsSnapshot.size);
      } else {
        // Regular users see only their organization's projects
        const userDocRef = doc(db!, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          console.error("User has no organization ID");
          setActiveProjectsCount(null);
          return;
        }

        const projectsRef = collection(db!, "organizations", organizationId, "projects");
        const q = query(projectsRef, where("status", "==", "Active"));
        const projectsSnapshot = await getDocs(q);
        setActiveProjectsCount(projectsSnapshot.size);
      }
    } catch (error) {
      console.error("Error fetching active projects count:", error);
      setActiveProjectsCount(null);
    }
  }, [user]);

  const fetchFollowUpNotesCount = useCallback(async () => {
    if (!user || !db) return;
    try {
      console.log('📋 Fetching followUpNote documents assigned to user:', user.uid);
      
      const followUpNotesQuery = query(
        collectionGroup(db, 'followUpNote'),
        where('assignedTo', '==', user.uid)
      );
      
      const followUpNotesSnapshot = await getDocs(followUpNotesQuery);
      
      console.log('📊 Query returned', followUpNotesSnapshot.docs.length, 'follow-up notes');
      setFollowUpNotesCount(followUpNotesSnapshot.size);
    } catch (error) {
      console.error("Error fetching follow-up notes count:", error);
      setFollowUpNotesCount(null);
    }
  }, [user]);

  const fetchTeamMembersCount = useCallback(async () => {
    if (!user || !db) return;
    try {
      // Check if user is admin first
      const isAdmin = await checkIsAdmin(user);
      
      if (isAdmin) {
        // Admin users can see all users across all organizations
        const allUsersRef = collection(db!, "users");
        const allUsersSnapshot = await getDocs(allUsersRef);
        setTeamMembersCount(allUsersSnapshot.size);
      } else {
        // Regular users see only their organization's team members
        const userDocRef = doc(db!, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          console.error("User has no organization ID");
          setTeamMembersCount(null);
          return;
        }

        const usersRef = collection(db!, "users");
        const q = query(usersRef, where("organizationId", "==", organizationId));
        const usersSnapshot = await getDocs(q);
        setTeamMembersCount(usersSnapshot.size);
      }
    } catch (error) {
      console.error("Error fetching team members count:", error);
      setTeamMembersCount(null);
    }
  }, [user]);


  const fetchOverdueNotesCount = useCallback(async () => {
    if (!user || !db) return;
    try {
      // Check if user is admin first
      const isAdmin = await checkIsAdmin(user);
      
      if (!isAdmin) {
        // For regular users, verify they have an organization ID
        const userDocRef = doc(db!, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          console.error("User has no organization ID");
          setOverdueNotesCount(0);
          return;
        }
      }
      // Admin users don't need organization ID check since they can be assigned notes across organizations

      // Query follow-up notes assigned to user
      const followUpNotesQuery = query(
        collectionGroup(db, 'followUpNote'),
        where('assignedTo', '==', user.uid)
      );
      
      const followUpNotesSnapshot = await getDocs(followUpNotesQuery);
      
      // Build a map of photo follow-up notes like the kanban page does
      const photoNotesMap: {[key: string]: Array<{id: string; [key: string]: unknown}>} = {};
      
      for (const noteDoc of followUpNotesSnapshot.docs) {
        const pathSegments = noteDoc.ref.path.split('/');
        const orgId = pathSegments[1];
        const projectId = pathSegments[3];
        const photoId = pathSegments[5];
        
        const photoKey = `${orgId}/${projectId}/${photoId}`;
        if (!photoNotesMap[photoKey]) {
          try {
            const allNotesQuery = query(
              collection(db!, `organizations/${orgId}/projects/${projectId}/photos/${photoId}/followUpNote`),
              orderBy("createdAt", "desc")
            );
            const allNotesSnapshot = await getDocs(allNotesQuery);
            photoNotesMap[photoKey] = allNotesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
          } catch (error) {
            console.error('Error fetching photo follow-up notes:', error);
            photoNotesMap[photoKey] = [];
          }
        }
      }

      // Helper functions matching kanban logic
      const getMostRecentDueDate = (photoId: string, organizationId: string, projectId: string) => {
        const photoKey = `${organizationId}/${projectId}/${photoId}`;
        const notes = photoNotesMap[photoKey] || [];
        const notesWithDueDate = notes.filter(note => note.dueDate);
        if (notesWithDueDate.length === 0) return null;
        
        const mostRecentNote = notesWithDueDate.sort((a, b) => {
          const aCreatedAt = (a.createdAt as {seconds: number} | undefined)?.seconds || 0;
          const bCreatedAt = (b.createdAt as {seconds: number} | undefined)?.seconds || 0;
          return new Date(bCreatedAt * 1000).getTime() - new Date(aCreatedAt * 1000).getTime();
        })[0];
        
        return (mostRecentNote.dueDate as {seconds: number; nanoseconds: number}) || null;
      };

      const isOverdueOrDueToday = (dueDateTimestamp: {seconds: number; nanoseconds: number} | null) => {
        if (!dueDateTimestamp) return false;
        
        const dueDate = new Date(dueDateTimestamp.seconds * 1000);
        const today = new Date();
        
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        return dueDate <= today;
      };
      
      let overdueCount = 0;
      
      // Count only "Open" status items that are overdue (matching kanban "To Do" column)
      for (const noteDoc of followUpNotesSnapshot.docs) {
        const noteData = noteDoc.data();
        const pathSegments = noteDoc.ref.path.split('/');
        const orgId = pathSegments[1];
        const projectId = pathSegments[3];
        const photoId = pathSegments[5];
        
        // Only count notes with "Open" status (matching kanban "To Do" column filter)
        if (noteData.status !== 'Open') {
          continue;
        }
        
        // Use the kanban logic to get most recent due date for this photo
        const mostRecentDue = getMostRecentDueDate(photoId, orgId, projectId);
        
        if (mostRecentDue && isOverdueOrDueToday(mostRecentDue)) {
          overdueCount++;
        }
      }
      
      setOverdueNotesCount(overdueCount);
    } catch (error) {
      console.error("Error fetching overdue notes count:", error);
      setOverdueNotesCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveProjectsCount();
    fetchFollowUpNotesCount();
    fetchTeamMembersCount();
    fetchOverdueNotesCount();
  }, [fetchActiveProjectsCount, fetchFollowUpNotesCount, fetchTeamMembersCount, fetchOverdueNotesCount]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const isActive = (path: string) => {
    if (path === "/protected") {
      return pathname === "/protected";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 font-sans flex flex-col">
      {/* Full Width Header */}
      <header className="sticky top-4 bg-white dark:bg-gray-900 p-4 px-12 mx-4 flex justify-between items-center shadow-md z-50 rounded-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <Logo />
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">PhotoNote</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard</p>
            </div>
          </div>
          <div className="relative w-72" ref={projectDropdownRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-gray-900 dark:text-white">
                  {selectedProject === 'all' ? 'All Projects' : projects.find(p => p.id === selectedProject)?.name || 'All Projects'}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Project Dropdown */}
            {projectDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setSelectedProject('all');
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                      selectedProject === 'all' ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    All Projects
                  </button>
                  
                  {projectsLoading ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Loading projects...
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No projects found
                    </div>
                  ) : (
                    projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProject(project.id);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                          selectedProject === project.id ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="truncate">{project.name}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          project.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          project.status === 'Review' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {project.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative">
            <Icon path="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            {overdueNotesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {overdueNotesCount > 99 ? '99+' : overdueNotesCount}
              </span>
            )}
          </button>
          <div className="flex items-center ml-4 relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <Image 
                src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} 
                alt="User" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full" 
                unoptimized
                onError={(e) => {
                  // Fallback to a default avatar if the image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=6366f1&color=fff&size=32`;
                }}
              />
              <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{user?.displayName || "User"}</span>
              <svg 
                className={`w-4 h-4 ml-1 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push('/protected/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Manage Profile
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="relative flex flex-col w-64 bg-white dark:bg-gray-900 overflow-hidden sticky top-0 h-screen">
          <aside className="flex-1 p-6 flex flex-col justify-between bg-white dark:bg-gray-900 relative z-10 overflow-y-auto">
            <div>
            <nav className="pt-8">
              <ul>
                <li className="mb-4">
                  <button
                    onClick={() => handleNavigation("/protected")}
                    className={`w-full flex items-center p-2 rounded-lg transition-all duration-200 ${
                      isActive("/protected") 
                        ? "text-white bg-sky-700" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    } ${navigating === "/protected" ? "opacity-75 scale-95" : ""}`}
                    disabled={navigating === "/protected"}
                  >
                    <FormatListBulletedIcon className="w-5 h-5 mr-3" />
                    Dashboard
                    {navigating === "/protected" && (
                      <svg className="animate-spin h-4 w-4 ml-auto" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="m12 2 a10 10 0 0 1 10 10l-4 0a6 6 0 0 0-6-6z"/>
                      </svg>
                    )}
                  </button>
                </li>
                <li className="mb-4">
                  <button
                    onClick={() => handleNavigation("/protected/todo")}
                    className={`w-full flex items-center p-2 rounded-lg transition-all duration-200 ${
                      isActive("/protected/todo")
                        ? "text-white bg-sky-700"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    } ${navigating === "/protected/todo" ? "opacity-75 scale-95" : ""}`}
                    disabled={navigating === "/protected/todo"}
                  >
                    <PendingActionsIcon className="w-5 h-5 mr-3" />
                    Revenue
                    {navigating === "/protected/todo" && (
                      <svg className="animate-spin h-4 w-4 ml-auto" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="m12 2 a10 10 0 0 1 10 10l-4 0a6 6 0 0 0-6-6z"/>
                      </svg>
                    )}
                  </button>
                </li>

                
                {/* Admin Dashboard Link - Only visible to admin users */}
                <AdminAccess user={user} />
                
              </ul>
            </nav>

          </div>
          {/* Settings link */}
          <div className="mt-8">
            <Link
              href="/protected/settings"
              className={`flex items-center p-2 rounded-lg transition-colors ${
                isActive("/protected/settings")
                  ? "text-white bg-purple-500"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <SettingsIcon className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </div>
        </aside>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Main content */}
          <main className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
