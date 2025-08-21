import { User } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase';

interface AdminRoleResult {
  message: string;
  uid: string;
}

interface UserDetails {
  uid: string;
  email: string;
  emailVerified: boolean;
  disabled: boolean;
  customClaims: Record<string, unknown>;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

interface ListUsersResult {
  users: UserDetails[];
  pageToken?: string;
}

const functions = app ? getFunctions(app) : null;

// Check if a user has admin privileges
export const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;

  try {
    // Force refresh to get latest claims
    const idTokenResult = await user.getIdTokenResult(true);
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Admin-only function to add admin role to a user
export const addAdminRole = async (email: string): Promise<AdminRoleResult> => {
  if (!functions) throw new Error('Firebase not initialized');
  const addAdminRoleFunction = httpsCallable(functions, 'addAdminRole');
  try {
    const result = await addAdminRoleFunction({ email });
    return result.data as AdminRoleResult;
  } catch (error) {
    console.error('Error adding admin role:', error);
    throw error;
  }
};

// Admin-only function to remove admin role from a user
export const removeAdminRole = async (email: string): Promise<AdminRoleResult> => {
  if (!functions) throw new Error('Firebase not initialized');
  const removeAdminRoleFunction = httpsCallable(functions, 'removeAdminRole');
  try {
    const result = await removeAdminRoleFunction({ email });
    return result.data as AdminRoleResult;
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw error;
  }
};

// Admin-only function to list all users
export const listAllUsers = async (maxResults?: number, pageToken?: string): Promise<ListUsersResult> => {
  if (!functions) throw new Error('Firebase not initialized');
  const listAllUsersFunction = httpsCallable(functions, 'listAllUsers');
  try {
    const result = await listAllUsersFunction({ maxResults, pageToken });
    return result.data as ListUsersResult;
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
};

// Admin-only function to get user details by email
export const getUserByEmail = async (email: string): Promise<UserDetails> => {
  if (!functions) throw new Error('Firebase not initialized');
  const getUserByEmailFunction = httpsCallable(functions, 'getUserByEmail');
  try {
    const result = await getUserByEmailFunction({ email });
    return result.data as UserDetails;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Admin-only function to disable/enable a user account
export const setUserDisabled = async (uid: string, disabled: boolean): Promise<AdminRoleResult> => {
  if (!functions) throw new Error('Firebase not initialized');
  const setUserDisabledFunction = httpsCallable(functions, 'setUserDisabled');
  try {
    const result = await setUserDisabledFunction({ uid, disabled });
    return result.data as AdminRoleResult;
  } catch (error) {
    console.error('Error updating user disabled status:', error);
    throw error;
  }
};

