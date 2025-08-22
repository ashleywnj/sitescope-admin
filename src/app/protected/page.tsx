"use client";

// Disable static generation for this page since it uses Firebase
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../firebase";
import Layout from "./components/Layout";
import { ProjectFilterProvider } from "../contexts/ProjectFilterContext";
import { collection, query, getDocs, doc, getDoc, Timestamp, collectionGroup } from "firebase/firestore";
import { db } from "../firebase";
import { checkIsAdmin } from "../admin/utils/adminAuth";

interface Project {
  id: string;
  name: string;
  status: string;
  description?: string;
  createdAt?: Timestamp;
}

export default function ProtectedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [organizationsCount, setOrganizationsCount] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Call fetchProjects after user state is set
        setTimeout(() => fetchProjects(currentUser.uid, currentUser), 0);
      } else {
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchProjects = async (userId: string, currentUser?: User) => {
    if (!db) return;
    const userToCheck = currentUser || user;
    if (!userToCheck) return;
    try {
      setProjectsLoading(true);
      
      // Check if user is admin
      const isAdmin = await checkIsAdmin(userToCheck);
      
      if (isAdmin) {
        // Admin user: Show data from all organizations
        console.log("Admin user detected - fetching data from all organizations");
        
        // Count all organizations
        try {
          const organizationsRef = collection(db!, "organizations");
          const organizationsSnapshot = await getDocs(organizationsRef);
          setOrganizationsCount(organizationsSnapshot.size);
        } catch (error) {
          console.error("Error fetching organizations count:", error);
          setOrganizationsCount(null);
        }

        // Get all projects from all organizations using collectionGroup
        try {
          const allProjectsQuery = query(collectionGroup(db!, "projects"));
          const allProjectsSnapshot = await getDocs(allProjectsQuery);
          
          const projectsData = allProjectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];
          
          setProjects(projectsData);
        } catch (error) {
          console.error("Error fetching all projects:", error);
          setProjects([]);
        }
      } else {
        // Regular user: Show data from their organization only
        const userDocRef = doc(db!, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          console.error("User has no organization ID");
          setProjects([]);
          setOrganizationsCount(1); // Regular users see their own org count as 1
          return;
        }

        // Count only their organization (always 1 for regular users)
        setOrganizationsCount(1);

        // Get projects from their organization only
        const projectsRef = collection(db!, "organizations", organizationId, "projects");
        const q = query(projectsRef);
        const projectsSnapshot = await getDocs(q);
        
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProjectFilterProvider user={user}>
      <Layout user={user} onLogout={handleLogout}>
        <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.displayName || user.email}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s an overview of your projects and recent activity
          </p>
        </div>

        {/* Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Projects</h3>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {projects.filter(p => p.status === 'Active').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Currently in progress</p>
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Organizations</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {organizationsCount !== null ? organizationsCount : "..."}
                  </span>
                </div>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Projects</h3>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {projects.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Across all statuses</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Projects</h3>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {projects.filter(p => p.status === 'Review').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Awaiting review</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
          </div>
          <div className="p-6">
            {projectsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">No projects found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Projects will appear here once they&apos;re created</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        project.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        project.status === 'Review' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {project.status}
                      </span>
                      {project.createdAt && (
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {new Date(project.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
              </div>
      </Layout>
    </ProjectFilterProvider>
  );
}
