# LAUDE.local.md

Recommended pattern for multi-tenant applications in Firebase. The best way to create a super-admin role is by using Firebase Custom Claims.

A custom claim is a piece of metadata you securely attach to a user's account from a backend environment. It's included in their ID token whenever they sign in, making it perfect for role-based access control.

Here’s a complete breakdown of how to set this up.

## 1. Designating an Admin with Custom Claims 👑
You can't set custom claims from the client-side app; that would be insecure. You must set them from a privileged server environment, like a Cloud Function or your own backend using the Firebase Admin SDK.

The process involves creating a Cloud Function that you can trigger to grant a specific user the admin role.

Example: A Cloud Function to make a user an admin
You would deploy this function and then call it (securely) with the email address of the user you want to promote.

JavaScript

// a callable cloud function to set an admin claim
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is already an admin
  // This prevents non-admins from promoting others.
  // For the *first* admin, you might trigger this manually or have a different security check.
  if (context.auth.token.admin !== true) {
    return { error: "Only admins can add other admins." };
  }

  // Get user by email and add the custom claim
  try {
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });
    return { message: `Success! ${data.email} has been made an admin.` };
  } catch (err) {
    return { error: err.message };
  }
});
To set the very first admin, you can deploy this function and call it manually from your developer machine or the Google Cloud console, bypassing the if (context.auth.token.admin !== true) check for that one initial run.

## 2. Securing Your Database with Security Rules 🛡️
Now that your admin user has a special admin: true claim in their ID token, you can reference it in your Security Rules to grant them universal access.

Let's assume your data is structured by organization ID. A normal user can only access their own organization's data, but an admin can access any.

For Firestore:
JavaScript

// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // An admin can read and write anything
    function isAdmin() {
      return request.auth.token.admin == true;
    }
    
    // A regular user must belong to the organization
    function isMember(orgId) {
      return request.auth.token.organizationId == orgId;
    }

    match /organizations/{orgId}/{document=**} {
      allow read, write: if isAdmin() || isMember(orgId);
    }
  }
}
For Realtime Database:
JSON

// rtdb.rules.json
{
  "rules": {
    "organizations": {
      "$orgId": {
        // An admin gets full access OR the user's orgId claim matches the path
        ".read": "auth.token.admin === true || auth.token.organizationId === $orgId",
        ".write": "auth.token.admin === true || auth.token.organizationId === $orgId"
      }
    },
    "users": {
       // All users can see the user list, but only admins can write to it
       ".read": "auth != null",
       ".write": "auth.token.admin === true"
    }
  }
}
With these rules, a logged-in user with the admin: true claim will bypass the organization-specific checks and be able to read/write data across all organizations.

## 3. Building the Admin Dashboard 🖥️
Your admin dashboard is a separate front-end application. Here's the logic it should follow:

User Sign-In: The admin user signs in using standard Firebase Authentication.

Check Claims: After sign-in, get the user's ID token result. This object contains the custom claims. It's important to force a refresh of the token if the claim was just added, to ensure you have the latest version.

Grant Access: If claims.admin === true, render the admin dashboard. Otherwise, show an "Access Denied" message and log them out.

Client-side JavaScript Example:

JavaScript

import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in.
    const idTokenResult = await user.getIdTokenResult(true); // Force refresh to get latest claims
    
    if (!!idTokenResult.claims.admin) {
      // Show the admin dashboard!
      console.log("Welcome, Admin!");
      renderAdminDashboard();
    } else {
      // Not an admin, deny access.
      console.log("Access Denied. You are not an admin.");
      auth.signOut();
    }
  } else {
    // User is signed out.
    // Show login page.
  }
});
## 4. Managing Users from the Dashboard ⚙️
Your admin will need to perform actions like listing all users, disabling accounts, or changing roles. These actions require the Firebase Admin SDK and cannot be done from the client.

The solution is to create more Callable Cloud Functions that your admin dashboard can invoke.

Example: A Cloud Function to list all users

JavaScript

// In your cloud functions file...
exports.listAllUsers = functions.https.onCall(async (data, context) => {
  // First, verify the caller is an admin
  if (context.auth.token.admin !== true) {
    return { error: "Permission denied. Must be an admin." };
  }

  // List all users
  try {
    const userRecords = await admin.auth().listUsers(1000); // Max 1000 per page
    const users = userRecords.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        disabled: user.disabled,
        customClaims: user.customClaims
    }));
    return { users: users };
  } catch (err) {
    return { error: err.message };
  }
});
Your admin dashboard would then call this function from the front end to securely fetch the user list and display it. This combination of Custom Claims for role definition, Security Rules for data access, and Cloud Functions for privileged actions creates a secure and scalable admin system.







Hi. I have a firebase project that is multi-tenant. I am using firebase authorization and firebase database. I have the concept of an organization that an authorized user is associated with. I want to also have an Admin user that can see and manage all organizations and users. This would be for a separate admin dashboard.




Show thinking
Of course. What you're describing is a very common and recommended pattern for multi-tenant applications in Firebase. The best way to create a super-admin role is by using Firebase Custom Claims.

A custom claim is a piece of metadata you securely attach to a user's account from a backend environment. It's included in their ID token whenever they sign in, making it perfect for role-based access control.

Here’s a complete breakdown of how to set this up.

## 1. Designating an Admin with Custom Claims 👑
You can't set custom claims from the client-side app; that would be insecure. You must set them from a privileged server environment, like a Cloud Function or your own backend using the Firebase Admin SDK.

The process involves creating a Cloud Function that you can trigger to grant a specific user the admin role.

Example: A Cloud Function to make a user an admin
You would deploy this function and then call it (securely) with the email address of the user you want to promote.

JavaScript

// a callable cloud function to set an admin claim
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the user calling the function is already an admin
  // This prevents non-admins from promoting others.
  // For the *first* admin, you might trigger this manually or have a different security check.
  if (context.auth.token.admin !== true) {
    return { error: "Only admins can add other admins." };
  }

  // Get user by email and add the custom claim
  try {
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });
    return { message: `Success! ${data.email} has been made an admin.` };
  } catch (err) {
    return { error: err.message };
  }
});
To set the very first admin, you can deploy this function and call it manually from your developer machine or the Google Cloud console, bypassing the if (context.auth.token.admin !== true) check for that one initial run.

## 2. Securing Your Database with Security Rules 🛡️
Now that your admin user has a special admin: true claim in their ID token, you can reference it in your Security Rules to grant them universal access.

Let's assume your data is structured by organization ID. A normal user can only access their own organization's data, but an admin can access any.

For Firestore:
JavaScript

// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // An admin can read and write anything
    function isAdmin() {
      return request.auth.token.admin == true;
    }
    
    // A regular user must belong to the organization
    function isMember(orgId) {
      return request.auth.token.organizationId == orgId;
    }

    match /organizations/{orgId}/{document=**} {
      allow read, write: if isAdmin() || isMember(orgId);
    }
  }
}
For Realtime Database:
JSON

// rtdb.rules.json
{
  "rules": {
    "organizations": {
      "$orgId": {
        // An admin gets full access OR the user's orgId claim matches the path
        ".read": "auth.token.admin === true || auth.token.organizationId === $orgId",
        ".write": "auth.token.admin === true || auth.token.organizationId === $orgId"
      }
    },
    "users": {
       // All users can see the user list, but only admins can write to it
       ".read": "auth != null",
       ".write": "auth.token.admin === true"
    }
  }
}
With these rules, a logged-in user with the admin: true claim will bypass the organization-specific checks and be able to read/write data across all organizations.

## 3. Building the Admin Dashboard 🖥️
Your admin dashboard is a separate front-end application. Here's the logic it should follow:

User Sign-In: The admin user signs in using standard Firebase Authentication.

Check Claims: After sign-in, get the user's ID token result. This object contains the custom claims. It's important to force a refresh of the token if the claim was just added, to ensure you have the latest version.

Grant Access: If claims.admin === true, render the admin dashboard. Otherwise, show an "Access Denied" message and log them out.

Client-side JavaScript Example:

JavaScript

import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in.
    const idTokenResult = await user.getIdTokenResult(true); // Force refresh to get latest claims
    
    if (!!idTokenResult.claims.admin) {
      // Show the admin dashboard!
      console.log("Welcome, Admin!");
      renderAdminDashboard();
    } else {
      // Not an admin, deny access.
      console.log("Access Denied. You are not an admin.");
      auth.signOut();
    }
  } else {
    // User is signed out.
    // Show login page.
  }
});
## 4. Managing Users from the Dashboard ⚙️
Your admin will need to perform actions like listing all users, disabling accounts, or changing roles. These actions require the Firebase Admin SDK and cannot be done from the client.

The solution is to create more Callable Cloud Functions that your admin dashboard can invoke.

Example: A Cloud Function to list all users

JavaScript

// In your cloud functions file...
exports.listAllUsers = functions.https.onCall(async (data, context) => {
  // First, verify the caller is an admin
  if (context.auth.token.admin !== true) {
    return { error: "Permission denied. Must be an admin." };
  }

  // List all users
  try {
    const userRecords = await admin.auth().listUsers(1000); // Max 1000 per page
    const users = userRecords.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        disabled: user.disabled,
        customClaims: user.customClaims
    }));
    return { users: users };
  } catch (err) {
    return { error: err.message };
  }
});
Your admin dashboard would then call this function from the front end to securely fetch the user list and display it. This combination of Custom Claims for role definition, Security Rules for data access, and Cloud Functions for privileged actions creates a secure and scalable admin system.