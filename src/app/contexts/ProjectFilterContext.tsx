"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectFilterContextType {
  selectedProject: string;
  setSelectedProject: (projectId: string) => void;
  projects: Project[];
  projectsLoading: boolean;
}

const ProjectFilterContext = createContext<ProjectFilterContextType | undefined>(undefined);

export const useProjectFilter = () => {
  const context = useContext(ProjectFilterContext);
  if (!context) {
    throw new Error('useProjectFilter must be used within a ProjectFilterProvider');
  }
  return context;
};

interface ProjectFilterProviderProps {
  children: ReactNode;
  user: User | null;
}

export const ProjectFilterProvider: React.FC<ProjectFilterProviderProps> = ({ children, user }) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          setProjects([]);
          return;
        }

        const projectsRef = collection(db, "organizations", organizationId, "projects");
        const q = query(projectsRef);
        const projectsSnapshot = await getDocs(q);
        
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  return (
    <ProjectFilterContext.Provider value={{
      selectedProject,
      setSelectedProject,
      projects,
      projectsLoading
    }}>
      {children}
    </ProjectFilterContext.Provider>
  );
};
