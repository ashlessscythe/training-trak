import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  // Configure URLs for authentication flows
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
    // Use consistent URL format for handlers
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
  },
});
