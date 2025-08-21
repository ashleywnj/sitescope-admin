import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Cloud Function to add admin role to a user
export const addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is already an admin
  // For the first admin, you can bypass this check temporarily
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can add other admins.'
    );
  }

  // Validate email parameter
  if (!data.email || typeof data.email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Email is required and must be a string.'
    );
  }

  try {
    // Get user by email and add the custom claim
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });
    
    return { 
      message: `Success! ${data.email} has been made an admin.`,
      uid: user.uid 
    };
  } catch (error) {
    console.error('Error adding admin role:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Error adding admin role: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Cloud Function to remove admin role from a user
export const removeAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is an admin
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can remove admin roles.'
    );
  }

  // Validate email parameter
  if (!data.email || typeof data.email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Email is required and must be a string.'
    );
  }

  try {
    // Get user by email and remove the admin claim
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: false,
    });
    
    return { 
      message: `Success! Admin role removed from ${data.email}.`,
      uid: user.uid 
    };
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Error removing admin role: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Cloud Function to list all users (admin only)
export const listAllUsers = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is an admin
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can list users.'
    );
  }

  try {
    const maxResults = data.maxResults || 1000;
    const pageToken = data.pageToken || undefined;
    
    const userRecords = await admin.auth().listUsers(maxResults, pageToken);
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      customClaims: user.customClaims,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      }
    }));
    
    return { 
      users: users,
      pageToken: userRecords.pageToken 
    };
  } catch (error) {
    console.error('Error listing users:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Error listing users: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Cloud Function to get user details by email (admin only)
export const getUserByEmail = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is an admin
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can get user details.'
    );
  }

  // Validate email parameter
  if (!data.email || typeof data.email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Email is required and must be a string.'
    );
  }

  try {
    const user = await admin.auth().getUserByEmail(data.email);
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      customClaims: user.customClaims,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      }
    };
  } catch (error) {
    console.error('Error getting user:', error);
    throw new functions.https.HttpsError(
      'not-found', 
      `User not found: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Cloud Function to disable/enable a user account (admin only)
export const setUserDisabled = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is an admin
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can disable/enable users.'
    );
  }

  // Validate parameters
  if (!data.uid || typeof data.uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'UID is required and must be a string.'
    );
  }

  if (typeof data.disabled !== 'boolean') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Disabled status must be a boolean.'
    );
  }

  try {
    await admin.auth().updateUser(data.uid, {
      disabled: data.disabled,
    });
    
    return { 
      message: `User ${data.disabled ? 'disabled' : 'enabled'} successfully.`,
      uid: data.uid 
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});