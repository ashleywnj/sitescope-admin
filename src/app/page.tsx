"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import Logo from "./protected/components/Logo";
import Icon from "./protected/components/Icon";


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const getReadableErrorMessage = (error: string) => {
    if (error.includes('user-not-found')) return 'No account found with this email address';
    if (error.includes('wrong-password')) return 'Incorrect password. Please try again';
    if (error.includes('too-many-requests')) return 'Too many failed attempts. Please wait a moment';
    if (error.includes('invalid-email')) return 'Please enter a valid email address';
    if (error.includes('user-disabled')) return 'This account has been disabled. Contact your administrator';
    return 'Unable to sign in. Please check your credentials and try again';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/protected");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Logo />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-sky-700 rounded-full flex items-center justify-center">
                <Icon 
                  path="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.804-2.169A47.81 47.81 0 0018.186 7.23c-.38-.054-.757-.112-1.134-.175a2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.86-1.04 47.981 47.981 0 00-6.46 0 2.192 2.192 0 00-1.86 1.04l-.822 1.316z M16.5 9.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" 
                  className="w-3 h-3 text-white"
                />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to PhotoNotes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Professional photo documentation for theatre and construction projects
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter your credentials to access your projects
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Icon 
                  path="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" 
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  aria-describedby={error ? 'error-message' : undefined}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Icon 
                  path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" 
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  aria-describedby={error ? 'error-message' : undefined}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon 
                    path={showPassword 
                      ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                      : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    } 
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                id="error-message"
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" 
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <Icon 
                    path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                    className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                      Sign in failed
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {getReadableErrorMessage(error)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-700 hover:bg-sky-800 disabled:bg-sky-400 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:cursor-not-allowed transform active:scale-[0.98] min-h-[48px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing you in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon 
                    path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" 
                    className="w-5 h-5 mr-2"
                  />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Footer Help */}
      {/* <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-700 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need help accessing your account?{' '}
              <button className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium underline-offset-2 hover:underline transition-colors">
                Contact your administrator
              </button>
            </p>
          </div> */}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Your data is secure and encrypted. 
          </p>
        </div>
      </div>
    </div>
  );
} 