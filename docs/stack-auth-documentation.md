---
slug: faq
subtitle: Frequently asked questions about Stack
---

## Languages & Frameworks

<AccordionGroup>
  <Accordion title="What languages are supported?">
    For frontends, Stack supports TypeScript and JavaScript. For backends, Stack has a flexible [REST API](/rest-api) that can be used with any language or framework.
  </Accordion>
  <Accordion title="Can I use Stack with other JavaScript frameworks, like Astro or Angular?">
    Yes! You can use our vanilla JavaScript SDK, or, if the framework is React-based, our React SDK.
  </Accordion>
  <Accordion title="Can I use Stack with the Next.js pages router?">
    Only the Next.js app router is currently officially supported, although some members of the community have successfully used the React or vanilla JavaScript SDKs with the pages router.
  </Accordion>
</AccordionGroup>

## Product

<AccordionGroup>
  <Accordion title="How do you compare to `<X>`?">
    Ask yourself about `<X>`:

    - Is `<X>` open-source?
    - Is `<X>` developer-friendly, well-documented, and lets you get started in minutes?
    - Besides authentication, does `<X>` also do authorization and user management (see feature list below)?

    If you answered "no" to any of these questions, then that's how Stack Auth is different from `<X>`.

  </Accordion>
  <Accordion title="Can I migrate my existing userbase to Stack Auth?">
    Yes! You can [create users programmatically](/rest-api/server/users/create-user) using our [REST API](/rest-api).
  </Accordion>
</AccordionGroup>

## Other

<AccordionGroup>
  <Accordion title="How can I contribute?">
    Please carefully read our [CONTRIBUTING.md](https://github.com/stack-auth/stack-auth/blob/dev/CONTRIBUTING.md). 
  </Accordion>
</AccordionGroup>

---

slug: getting-started/setup
subtitle: Getting started with Stack in 5 minutes

---

<Info>
Welcome to the Next.js SDK setup guide. If you're looking for guides for other frameworks, check out the [React SDK Setup](/react/getting-started/setup), or the [JavaScript SDK Setup](/js/getting-started/setup).
</Info>

## Setup

Before getting started, make sure you have a [Next.js project](https://nextjs.org/docs/getting-started/installation) using the app router, as Stack Auth does not support the pages router.

We recommend using our **setup wizard** for a seamless installation experience. The wizard automatically detects your project structure and walks you through the setup process. If you encounter any issues with the wizard, you can follow our manual installation steps instead.

<Tabs style={{backgroundColor: "black"}}>
<Tab title="Setup wizard (recommended)">
<Steps> ### Run installation wizard
Run Stack's installation wizard with the following command:

      ```sh title="Terminal"
      npx @stackframe/init-stack@latest
      ```

      ### Update API keys
      Then, create an account on [the Stack Auth dashboard](https://app.stack-auth.com/projects), create a new project with an API key, and copy its environment variables into the `.env.local` file of your Next.js project:

      ```sh title=".env.local"
      NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
      NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
      STACK_SECRET_SERVER_KEY=<your-secret-server-key>
      ```

      ### Done!
      That's it! The following files should have been created or updated in your project:

      - `app/handler/[...stack]/page.tsx`: This file contains the default pages for sign-in, sign-out, account settings, and more. If you prefer, later you will learn how to [use custom pages](/customization/custom-pages) instead.
      - `app/layout.tsx`: The layout file was updated to wrap the entire body with `StackProvider` and `StackTheme`.
      - `app/loading.tsx`: If not yet found, Stack automatically adds a Suspense boundary to your app. This is shown to the user while Stack's async hooks, like `useUser`, are loading.
      - `stack.ts`: This file contains the `stackServerApp` which you can use to access Stack from Server Components, Server Actions, API routes, and middleware.
    </Steps>

  </Tab>
  <Tab title="Manual installation">
    Note: The setup wizard also supports existing, complicated projects. Cases where manual installation is necessary are rare.

    If you are struggling with the setup wizard, please reach out to us on our [Discord](https://discord.stack-auth.com) first, where we'll be happy to help you.
    <Steps>
      ### Install npm package

      First, install Stack with npm, yarn, or pnpm:

      ```bash title="Terminal"
      npm install @stackframe/stack
      ```

      ### Create API keys

      If you haven't already, [register a new account on Stack](https://app.stack-auth.com/handler/sign-up). Create a project in the dashboard, create a new API key from the left sidebar, and copy the project ID, publishable client key, and secret server key into a new file called `.env.local` in the root of your Next.js project:

      ```sh title=".env.local"
      NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
      NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
      STACK_SECRET_SERVER_KEY=<your-secret-server-key>
      ```

      ### Create `stack.ts` file

      Create a new file `stack.ts` in your root directory and fill it with the following:

      ```tsx title="stack.ts"
      import "server-only";
      import { StackServerApp } from "@stackframe/stack";

      export const stackServerApp = new StackServerApp({
        tokenStore: "nextjs-cookie", // storing auth tokens in cookies
      });
      ```

      This will read the environment variables automatically and create a server app that you can later use to access Stack from your Next.js server.

      Check out the [`StackServerApp` documentation](/sdk/objects/stack-app) to learn more about its other options.

      ### Create Stack handler

      Create a new file in `app/handler/[...stack]/page.tsx` and paste the following code:

      ```tsx title="app/handler/[...stack]/page.tsx"
      import { StackHandler } from "@stackframe/stack";
      import { stackServerApp } from "@/stack";

      export default function Handler(props: unknown) {
        return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
      }
      ```

      This will create pages for sign-in, sign-up, password reset, and others. Additionally, it will be used as a callback URL for OAuth. You can [replace them with your own pages](/customization/custom-pages) later.


      ### Add StackProvider to `layout.tsx`

      In your `app/layout.tsx`, wrap the entire body with a `StackProvider` and `StackTheme`. Afterwards, it should look like this:

      ```tsx title="app/layout.tsx"
      import React from "react";
      import { StackProvider, StackTheme } from "@stackframe/stack";
      import { stackServerApp } from "@/stack";

      export default function RootLayout({ children }: { children: React.ReactNode }) {
        return (
          <html lang="en">
            <body>
              <StackProvider app={stackServerApp}>
                <StackTheme>
                  {children}
                </StackTheme>
              </StackProvider>
            </body>
          </html>
        );
      }
      ```

      ### Add Suspense boundary

      By default, Stack uses [`Suspense`](https://react.dev/reference/react/Suspense) to handle loading states. To show a loading indicator while Stack is fetching user data, make sure there is a `loading.tsx` file in your `app` directory:

      ```tsx title="app/loading.tsx"
      export default function Loading() {
        // You can use any loading indicator here
        return <>
          Loading...
        </>;
      }
      ```

      ### Done!
    </Steps>

  </Tab>
</Tabs>

## Post-setup

That's it! Stack is now configured in your Next.js project. If you start your Next.js app with `npm run dev` and navigate to [http://localhost:3000/handler/signup](http://localhost:3000/handler/sign-up), you will see the sign-up page.

<div className="stack-white-image-showcase stack-350h">
  <img src="file:014156ef-7666-4413-a0e9-4e0e8c89af35" alt="SignIn" />
</div>

After signing up/in, you will be redirected back to the home page. We will show you how to add user information to it in the next section. You can also check out the [http://localhost:3000/handler/account-settings](http://localhost:3000/handler/account-settings) page which looks like this:

![Stack account settings page](file:65f8e4df-2322-452d-91a2-d5b245695c87)

## Next steps

Next up, we will show you how to [retrieve and update user information](/getting-started/users), and how to [protect a page](/getting-started/users#protecting-a-page) from unauthorized access.

---

slug: getting-started/components
subtitle: Pre-built Next.js components to make your life easier

---

In [the last guide](/getting-started/setup), we initialized Stack. This time, we will take a quick look at some of the most useful Next.js components.

For the full documentation of all available components, please refer to the [components reference](/components).

## `<UserButton />`

The `<UserButton />` component shows the user's avatar that opens a dropdown with various user settings on click.

<div className="stack-white-image-showcase stack-200h">
  <img src="file:a385ae53-1ef9-4a5f-8d0b-5137ef851f56" alt="UserButton" />
</div>

```tsx title="page.tsx"
import { UserButton } from "@stackframe/stack";

export default function Page() {
  return <UserButton />;
}
```

## `<SignIn />` and `<SignUp />`

These components show a sign-in and sign-up form, respectively.

<div className="stack-white-image-showcase stack-350h">
  <img src="file:014156ef-7666-4413-a0e9-4e0e8c89af35" alt="SignIn" />
</div>

```tsx title="page.tsx"
import { SignIn } from "@stackframe/stack";

export default function Page() {
  return <SignIn />;
}
```

All of Stack's components are modular and built from smaller primitives. For example, the `<SignIn />` component is composed of the following:

- An `<OAuthButtonGroup />`, which itself is composed of multiple `<OAuthButton />` components
- A `<MagicLinkSignIn />`, which has a text field and calls `useStackApp().signInWithMagicLink()`
- A `<CredentialSignIn />`, which has two text fields and calls `useStackApp().signInWithCredential()`

You can use these components individually to build a custom sign-in component.

To change the default sign-in URL to your own, see the documentation on [custom pages](/customization/custom-pages).

## Others

Stack has many more components available. For a comprehensive list, please check the documentation on [components](/components).

## Next steps

In the next guide, we will do a deep-dive into retrieving and modifying user objects, as well as how to protect a page.

---

slug: getting-started/users
subtitle: 'Reading and writing user information, and protecting pages'

---

You will inevitably build custom components that access the user in one way or another. In this section, we will take a closer look at the functions and hooks that let you do this.

## Client Component basics

The `useUser()` hook returns the current user in a Client Component. By default, it will return `null` if the user is not signed in.

```tsx title="my-client-component.tsx"
"use client";
import { useUser } from "@stackframe/stack";

export function MyClientComponent() {
  const user = useUser();
  return (
    <div>
      {user ? `Hello, ${user.displayName ?? "anon"}` : "You are not logged in"}
    </div>
  );
}
```

The `useUser()` hook is simply a shorthand for `useStackApp().useUser()`. `useStackApp()` also contains other useful hooks and methods for clients, which will be described later.

Sometimes, you want to retrieve the user only if they're signed in, and redirect to the sign-in page otherwise. In this case, simply pass `{ or: "redirect" }`, and the function will never return `null`.

```tsx
const user = useUser({ or: "redirect" });
return <div>{`Hello, ${user.displayName ?? "anon"}`}</div>;
```

## Server Component basics

Since `useUser()` is a stateful hook, you can't use it on server components. Instead, you can import `stackServerApp` from `stack.ts` and call `getUser()`:

```tsx title="my-server-component.tsx"
import { stackServerApp } from "@/stack";

export default async function MyServerComponent() {
  const user = await stackServerApp.getUser(); // or: stackServerApp.getUser({ or: "redirect" })
  return (
    <div>
      {user ? `Hello, ${user.displayName ?? "anon"}` : "You are not logged in"}
    </div>
  );
}
```

<Note>
Since `useUser()` is a hook, it will re-render the component on user changes (eg. signout), while `getUser()` will only fetch the user once (on page load). You can also call `useStackApp().getUser()` on the client side to get the user in a non-component context.
</Note>

## Protecting a page

There are three ways to protect a page: in Client Components with `useUser({ or: "redirect" })`, in Server Components with `await getUser({ or: "redirect" })`, or with middleware.

On Client Components, the `useUser({ or: 'redirect' })` hook will redirect the user to the sign-in page if they are not logged in. Similarly, on Server Components, call `await getUser({ or: "redirect" })` to protect a page (or component).

Middleware can be used whenever it is easy to tell whether a page should be protected given just the URL, for example, when you have a `/private` section only accessible to logged-in users.

<Tabs>
  <Tab title="Client Component">
    ```tsx title="my-protected-client-component.tsx"
    "use client";
    import { useUser } from "@stackframe/stack";

    export default function MyProtectedClientComponent() {
      useUser({ or: 'redirect' });
      return <h1>You can only see this if you are logged in</h1>
    }
    ```

  </Tab>

  <Tab title="Server Component">
    ```tsx title="my-protected-server-component.tsx"
    import { stackServerApp } from "@/stack";

    export default async function MyProtectedServerComponent() {
      await stackServerApp.getUser({ or: 'redirect' });
      return <h1>You can only see this if you are logged in</h1>
    }
    ```

  </Tab>

  <Tab title="Middleware">
    ```tsx title="middleware.tsx"
    export async function middleware(request: NextRequest) {
      const user = await stackServerApp.getUser();
      if (!user) {
        return NextResponse.redirect(new URL('/handler/sign-in', request.url));
      }
      return NextResponse.next();
    }

    export const config = {
      // You can add your own route protection logic here
      // Make sure not to protect the root URL, as it would prevent users from accessing static Next.js files or Stack's /handler path
      matcher: '/protected/:path*',
    };
    ```

  </Tab>
</Tabs>

<Note>
  If you have sensitive information hidden in the page HTML itself, be aware of Next.js differences when using Server vs. Client Components.

- **Client Components**: Client components are always sent to the browser, regardless of page protection. This is standard Next.js behavior. For more information, please refer to the [Next.js documentation](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment).

- **Server Components**: If a component is protected, it is guaranteed that its bundled HTML will not be sent to the browser if the user is not logged in. However, this is not necessarily true for its children and the rest of the page, as Next.js may split components on the same page and send them to the client separately for performance.

  For example, if your page is `<Parent><Child /></Parent>`, where `Parent` is protected and `Child` is not, Next.js may still send `<Child />` to the browser even if the user is not logged in. (Normal browsers will never display it, but attackers may be able to retrieve it.) Notably, this also applies to unprotected pages inside protected layouts.

  To remediate this, every component/page that contains sensitive information should protect itself, instead of relying on an outer layout. This is good practice anyways; it prevents you from accidentally exposing the data.

- **Middleware**: Prior to Next.js v15.2.3, Next.js allowed attackers to see unprotected components if you only protect on a middleware level. Since v15.2.3, this is no longer possible, and you don't have to worry about leaking sensitive information when using middleware to protect a route.

No matter which method you use, attackers will never be able to, say, impersonate a user.

</Note>

## User data

You can update attributes on a user object with the `user.update()` function.

```tsx title="my-client-component.tsx"
"use client";
import { useUser } from "@stackframe/stack";

export default function MyClientComponent() {
  const user = useUser();
  return (
    <button
      onClick={async () => await user.update({ displayName: "New Name" })}
    >
      Change Name
    </button>
  );
}
```

You can also store custom user data in the `clientMetadata`, `serverMetadata`, or `clientReadonlyMetadata` fields. More information [here](../concepts/custom-user-data).

## Signing out

You can sign out the user by redirecting them to `/handler/sign-out` or simply by calling `user.signOut()`. They will be redirected to the URL [configured as `afterSignOut` in the `StackServerApp`](/sdk/objects/stack-app).

<Tabs>
  <Tab title="user.signOut()">
    ```tsx title="sign-out-button.tsx"
    "use client";
    import { useUser } from "@stackframe/stack";

    export default function SignOutButton() {
      const user = useUser();
      return user ? <button onClick={() => user.signOut()}>Sign Out</button> : "Not signed in";
    }
    ```

  </Tab>

  <Tab title="Redirect">
    ```tsx title="sign-out-link.tsx"
    import { stackServerApp } from "@/stack";

    export default async function SignOutLink() {
      // stackServerApp.urls.signOut is equal to /handler/sign-out
      return <a href={stackServerApp.urls.signOut}>Sign Out</a>;
    }
    ```

  </Tab>
</Tabs>

## Example: Custom profile page

Stack automatically creates a user profile on sign-up. Let's build a page that displays this information. In `app/profile/page.tsx`:

<Tabs>
  <Tab title="Client Component">
    ```tsx title="app/profile/page.tsx"
    'use client';
    import { useUser, useStackApp, UserButton } from "@stackframe/stack";

    export default function PageClient() {
      const user = useUser();
      const app = useStackApp();
      return (
        <div>
          {user ? (
            <div>
              <UserButton />
              <p>Welcome, {user.displayName ?? "unnamed user"}</p>
              <p>Your e-mail: {user.primaryEmail}</p>
              <button onClick={() => user.signOut()}>Sign Out</button>
            </div>
          ) : (
            <div>
              <p>You are not logged in</p>
              <button onClick={() => app.redirectToSignIn()}>Sign in</button>
              <button onClick={() => app.redirectToSignUp()}>Sign up</button>
            </div>
          )}
        </div>
      );
    }
    ```

  </Tab>

  <Tab title="Server Component">
    ```tsx title="app/profile/page.tsx"
    import { stackServerApp } from "@/stack";
    import { UserButton } from "@stackframe/stack";

    export default async function Page() {
      const user = await stackServerApp.getUser();
      return (
        <div>
          {user ? (
            <div>
              <UserButton />
              <p>Welcome, {user.displayName ?? "unnamed user"}</p>
              <p>Your e-mail: {user.primaryEmail}</p>
              <p><a href={stackServerApp.urls.signOut}>Sign Out</a></p>
            </div>
          ) : (
            <div>
              <p>You are not logged in</p>
              <p><a href={stackServerApp.urls.signIn}>Sign in</a></p>
              <p><a href={stackServerApp.urls.signUp}>Sign up</a></p>
            </div>
          )}
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

After saving your code, you can see the profile page on [http://localhost:3000/profile](http://localhost:3000/profile).

For more examples on how to use the `User` object, check the [the SDK documentation](/sdk/types/user).

## Next steps

## In the next guide, we will show you how to put [your application into production](/getting-started/production).

slug: getting-started/production
subtitle: Steps to prepare Stack for production use

---

Stack makes development easy with various default settings, but these settings need to be optimized for security and user experience when moving to production. Here's a checklist of things you need to do before switching to production mode:

### Domains

By default, Stack allows all localhost paths as valid callback URLs. This is convenient for development but poses a security risk in production because attackers could use their own domains as callback URLs to intercept sensitive information. Therefore, in production, Stack must know your domain (e.g., `https://your-website.com`) and only allow callbacks from those domains.

Follow these steps when you're ready to push your application to production:

1. **Add Your Domain**: Navigate to the `Domain & Handlers` tab in the Stack dashboard. If you haven't configured your handler, you can leave it as the default. (Learn more about handlers [here](/sdk/objects/stack-app)).

2. **Disable Localhost Callbacks**: For enhanced security, disable the `Allow all localhost callbacks for development` option.

### OAuth providers

Stack uses shared OAuth keys for development to simplify setup when using "Sign in with Google/GitHub/etc." However, this isn't secure for production as it displays "Stack Development" on the providers' consent screens, making it unclear to users if the OAuth request is genuinely from your site. Thus, you should configure your own OAuth keys with the providers and connect them to Stack.

To use your own OAuth provider setups in production, follow these steps for each provider you use:

1. **Create an OAuth App**: On the provider's website, create an OAuth app and set the callback URL to the corresponding Stack callback URL. Copy the client ID and client secret.
   <Tabs>
   <Tab title="Google">
   [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2#1.-obtain-oauth-2.0-credentials-from-the-dynamic_data.setvar.console_name-.)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/google`
   </Tab>
   <Tab title="GitHub">
   [GitHub OAuth Setup Guide](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/github`
   </Tab>
   <Tab title="Facebook">
   [Facebook OAuth Setup Guide](https://developers.facebook.com/docs/development/create-an-app/facebook-login-use-case)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/facebook`
   </Tab>
   <Tab title="Microsoft">
   [Microsoft Azure OAuth Setup Guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/microsoft`
   </Tab>
   <Tab title="Spotify">
   [Spotify OAuth Setup Guide](https://developer.spotify.com/documentation/general/guides/app-settings/)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/spotify`
   </Tab>
   <Tab title="Gitlab">
   [Gitlab OAuth Setup Guide](https://docs.gitlab.com/ee/integration/oauth_provider.html)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/gitlab`
   </Tab>
   <Tab title="Bitbucket">
   [Bitbucket OAuth Setup Guide](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/bitbucket`
   </Tab>
   <Tab title="LinkedIn">
   [LinkedIn OAuth Setup Guide](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext&tabs=HTTPS1)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/linkedin`
   </Tab>
   <Tab title="X">
   [X OAuth Setup Guide](https://developer.x.com/en/docs/apps/overview)  
    Callback URL:  
    `https://api.stack-auth.com/api/v1/auth/oauth/callback/x`
   </Tab>
   </Tabs>

2. **Enter OAuth Credentials**: Go to the `Auth Methods` section in the Stack dashboard, open the provider's settings, switch from shared keys to custom keys, and enter the client ID and client secret.

### Email server

For development, Stack uses a shared email server, which sends emails from Stack's domain. This is not ideal for production as users may not trust emails from an unfamiliar domain. You should set up an email server connected to your own domain.

Steps to connect your own email server with Stack:

1. **Setup Email Server**: Configure your own email server and connect it to your domain (this step is beyond Stack's documentation scope).
2. **Configure Stack's Email Settings**: Navigate to the `Emails` section in the Stack dashboard, click `Edit` in the `Email Server` section, switch from `Shared` to `Custom SMTP server`, enter your SMTP configurations, and save.

### Enabling production mode

After completing the steps above, you can enable production mode on the `Project Settings` tab in the Stack dashboard, ensuring that your website runs securely with Stack in a production environment.

---

slug: concepts/stack-app
subtitle: The most important object of your Stack project

---

By now, you may have seen the `useStackApp()` hook and the `stackServerApp` variable. Both return a `StackApp`, of type `StackClientApp` and `StackServerApp` respectively.

Nearly all of Stack's functionality is on your `StackApp` object. Think of this object as the "connection" from your code to Stack's servers. Each app is always associated with one specific project ID (by default the one found in your environment variables).

There is also a page on [StackApp](../sdk/objects/stack-app) in the SDK reference, which lists all available functions.

## `getXyz`/`listXyz` vs. `useXyz`

You will see that most of the asynchronous functions on `StackApp` come in two flavors: `getXyz`/`listXyz` and `useXyz`. The former are asynchronous fetching functions which return a `Promise`, while the latter are React hooks that [suspend](https://react.dev/reference/react/Suspense) the current component until the data is available.

Normally, you would choose between the two based on whether you are in a React Server Component or a React Client Component. However, there are some scenarios where you use `getXyz` on the client, for example as the callback of an `onClick` handler.

```tsx
// server-component.tsx
async function ServerComponent() {
  const app = stackServerApp;
  // returns a Promise, must be awaited
  const user = await app.getUser();

  return <div>{user.displayName}</div>;
}

// client-component.tsx
("use client");
function ClientComponent() {
  const app = useStackApp();
  // returns the value directly
  const user = app.useUser();

  return <div>{user.displayName}</div>;
}
```

## Client vs. server

`StackClientApp` contains everything needed to build a frontend application, for example the currently authenticated user. It requires a publishable client key in its initialization (usually set by the `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` environment variable).

`StackServerApp` has all the functionality of `StackClientApp`, but also some functions with elevated permissions, eg. listing or modifying ALL users. This requires a secret server key (usually set by the `STACK_SECRET_SERVER_KEY` environment variable), which **must always be kept secret**.

There is also a third type, `StackAdminApp`, but it is rarely used. You can use it for automation or internal tools, and can edit your project's configuration.

<Note>
  Some of the functions have different return types; for example, `StackClientApp.getUser()` returns a `Promise<User>` while `StackServerApp.getUser()` returns a `Promise<ServerUser>`. The `Server` or `Admin` prefixes indicate that the object contains server-/admin-only functionality.
</Note>
---
slug: concepts/custom-user-data
subtitle: How to store custom user metadata in Stack Auth
---

Stack Auth allows storing additional user information through three types of metadata fields:

1. **clientMetadata**: Readable and writable from a [client](/concepts/stack-app#client-vs-server).
2. **serverMetadata**: Readable and writable only from a [server](/concepts/stack-app#client-vs-server).
3. **clientReadOnlyMetadata**: Readable from a client, writable only from a server.

## Client metadata

You can use the `clientMetadata` field to store non-sensitive information that both the client and server can read and write.

```tsx
await user.update({
  clientMetadata: {
    mailingAddress: "123 Main St",
  },
});

// On the client:
const user = useUser();
console.log(user.clientMetadata);
```

## Server-side metadata

For sensitive information, use the `serverMetadata` field. This ensures the data is only accessible and modifiable by the server.

```tsx
const user = await stackServerApp.getUser();
await user.update({
  serverMetadata: {
    secretInfo: "This is a secret",
  },
});

// To read:
const user = await stackServerApp.getUser();
console.log(user.serverMetadata);
```

## Client read-only metadata

Use `clientReadOnlyMetadata` for data that clients need to read but never modify, such as subscription status.

```tsx
// On the server:
const user = await stackServerApp.getUser();
await user.update({
  clientReadOnlyMetadata: {
    subscriptionPlan: "premium",
  },
});

// On the client:
const user = useUser();
console.log(user.clientReadOnlyMetadata);
```

---

slug: concepts/user-onboarding
subtitle: Implementing a user onboarding page and collecting information on sign-up

---

By default, Stack Auth collects information such as email addresses from OAuth providers. Sometimes, you may want to collect additional information from users during sign-up, for example a name or address.

The most straightforward approach is to redirect users to an onboarding page right after they sign up. However, this is not recommended for the following reasons:

1. Users can accidentally (or purposefully) close or navigate away from the page before completing the onboarding.
2. Redirect URLs may vary depending on the context. For instance, if a user is redirected to a sign-in page after trying to access a protected page, they'll expect to return to the original protected page post-authentication.

Instead, a more reliable strategy is to store an `onboarded` flag in the user's metadata and redirect users to the onboarding page if they haven't completed it yet.

## Example implementation

Let's say you have an onboarding page that asks for an address and stores it in the user's [metadata](/concepts/custom-user-data):

```jsx title="app/onboarding/page.tsx"
export default function OnboardingPage() {
  const user = useUser();
  const router = useRouter();
  const [address, setAddress] = useState('');


  return <>
    <input
      type="text"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
    />

    <button onClick={async () => {
      await user.update({
        clientMetadata: {
          onboarded: true,
          address,
        },
      });
      router.push('/');
    }}>
      Submit
    </button>
    </>
  );
}
```

<Note>
While the above implementation offers a basic onboarding process, users can still skip onboarding by directly sending an API request to update the `clientMetadata.onboarded` flag. If you want to ensure that onboarding cannot be bypassed on the API level, you should create a server endpoint to validate and store the data, then save the `onboarded` flag in the `clientReadonlyMetadata` on the server side after validation.
</Note>

Next, we can create a hook/function to check if the user has completed onboarding and redirect them to the onboarding page:

<Tabs>
<Tab title="Client Hook">
```jsx title="app/onboarding-hooks.ts"
'use client';
import { useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

export function useOnboarded() {
const user = useUser();
const router = useRouter();

useEffect(() => {
if (!user.clientMetadata.onboarded) {
router.push('/onboarding');
}
}, [user]);
}

````
</Tab>

<Tab title="Server Function">
```jsx title="app/onboarding-functions.ts"
import { stackServerApp } from '@/stack';
import { redirect } from 'next/navigation';

export async function ensureOnboarded() {
  const user = await stackServerApp.getUser();
  if (!user.serverMetadata.onboarded) {
    redirect('/onboarding');
  }
}
````

</Tab>
</Tabs>

You can then use these functions wherever onboarding is required:

<Tabs>
<Tab title="Client Component">
```jsx title="app/page.tsx"
import { useOnboarding } from '@/app/onboarding-hooks';
import { useUser } from '@stackframe/stack';

export default function HomePage() {
useOnboarding();
const user = useUser();

return (
<div>Welcome to the app, {user.displayName}</div>
);
}

````
</Tab>

<Tab title="Server Component">
```jsx title="app/page.tsx"
import { ensureOnboarding } from '@/app/onboarding-functions';
import { stackServerApp } from '@/stack';

export default async function HomePage() {
  await ensureOnboarding();
  const user = await stackServerApp.getUser();

  return (
    <div>Welcome to the app, {user.displayName}</div>
  );
}
````

</Tab>
</Tabs>
---
slug: concepts/oauth
subtitle: Managing third-party OAuth access tokens
---

Stack has good support for working with OAuth and OIDC providers, such as Google, Facebook, Microsoft, and others.

Beyond using OAuth for signing in, Stack can manage your users' access token so you can invoke APIs on their behalf. For example, you can use this to send emails with Gmail, access repositories on GitHub, or access files on OneDrive.

A connected account is simply an external account that is linked to the user in some way. If you are not using shared keys (see note below), any user created with "Sign up with OAuth" is automatically connected to the account they signed up with, but it's also possible to connect a user with a provider that is unavailable for sign in.

<Note>
  You cannot connect a user's accounts with shared OAuth keys. You need to set up your own OAuth client ID and client secret in Stack's dashboard. For more details, check [Going to Production](../getting-started/production#oauth-providers).
</Note>

## Connecting with OAuth providers

You can access a user's connected account with the `user.getConnectedAccount(providerId)` function or `user.useConnectedAccount(providerId)` hook.

Often, you'll want to redirect the user to the OAuth provider's authorization page if they have not connected the account yet. Just like the `getUser(...)` function, `getConnectedAccount(...)` can also take an `{ or: "redirect" }` argument to achieve this.

Here's how to connect with Google:

```jsx
"use client";

import { useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: "redirect" });
  // Redirects to Google authorization if not already connected
  const account = user.useConnectedAccount("google", { or: "redirect" });
  // Account is always defined because of the redirect
  return <div>Google account connected</div>;
}
```

## Providing scopes

Most providers have access control in the form of OAuth scopes. These are the permissions that the user will see on the authorization screen (eg. "Your App wants access to your calendar"). For instance, to read Google Drive content, you need the `https://www.googleapis.com/auth/drive.readonly` scope:

```jsx
"use client";

import { useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: "redirect" });
  // Redirects to the Google authorization page, requesting access to Google Drive
  const account = user.useConnectedAccount("google", {
    or: "redirect",
    scopes: ["https://www.googleapis.com/authdrive.readonly"],
  });
  // Account is always defined because of the redirect
  return <div>Google Drive connected</div>;
}
```

Check your provider's API documentation to find a list of available scopes.

## Retrieving the access token

Once connected with an OAuth provider, obtain the access token with the `account.getAccessToken()` function. Check your provider's API documentation to understand how you can use this token to authorize the user in requests.

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from "@stackframe/stack";

export default function Page() {
  const user = useUser({ or: 'redirect' });
  const account = user.useConnectedAccount('google', { or: 'redirect', scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
  const { accessToken } = account.useAccessToken();
  const [response, setResponse] = useState<any>();

  useEffect(() => {
    fetch('https://www.googleapis.com/drive/v3/files', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((res) => res.json())
      .then((data) => setResponse(data))
      .catch((err) => console.error(err));
  }, [accessToken]);

  return <div>{response ? JSON.stringify(response) : 'Loading...'}</div>;
}
```

## Sign-in default scopes

To avoid showing the authorization page twice, you can already request scopes during the sign-in flow. This approach is optional. Some applications may prefer to request extra permissions only when needed, while others might want to obtain all necessary permissions upfront.

To do this, edit the `oauthScopesOnSignIn` setting of your `stackServerApp`:

```jsx title='stack.ts'
export const stackServerApp = new StackServerApp({
  // ...your other settings...
  oauthScopesOnSignIn: {
    google: ["https://www.googleapis.com/authdrive.readonly"],
  },
});
```

## OAuth account merging strategies

When a user attempts to sign in with an OAuth provider that matches an existing account, Stack provides different strategies for handling the authentication flow.

The available strategies are:

- Allow duplicates (legacy default)
- Link method (new default)
- Block duplicates (most secure)

The "Link" strategy is the default behavior. If a user attempts to sign in with an OAuth provider that matches an existing account, Stack will link the OAuth identity to the existing account, and the user will be signed into that account.
This requires both of the credentials to be verified, or otherwise the link will be blocked, in the same way as the "Block" strategy.

The "Allow" strategy is the default behavior for old projects. If a user attempts to sign in with an OAuth provider that has an existing account with the same email address, Stack will create a separate account for the user.

## The "Block" strategy will explicitly raise an error if a user attempts to sign in with an OAuth provider that matches an existing account.

slug: concepts/orgs-and-teams
subtitle: Manage teams and team members

---

Teams provide a structured way to group users and manage their permissions. Users can belong to multiple teams simultaneously, allowing them to represent departments, B2B customers, or projects.

The server can perform all operations on a team, but the client can only carry out some actions if the user has the necessary permissions. This applies to all actions that can be performed on a server/client-side `User` object and a `Team` object.

## Concepts

### Team permissions

If you attempt to perform an action without the necessary team permissions, the function will throw an error. Always check if the user has the required permission before performing any action. Learn more about permissions [here](/concepts/permissions).

Here is an example of how to check if a user has a specific permission on the client

```tsx
const user = useUser({ or: "redirect" });
const team = user.useTeam("some-team-id");

if (!team) {
  return <div>Team not found</div>;
}

const hasPermission = user.usePermission(team, "$invite_members");

if (!hasPermission) {
  return <div>No permission</div>;
}

// Perform corresponding action like inviting a user
```

### Team profile

A user can have a different profile for each team they belong to (Note this is different to the user's personal profile). This profile contains information like `displayName` and `profileImageUrl`. The team profile can be left empty and it will automatically take the user's personal profile information.

The team profile is visible to all the other users in the team that have the `$read_members` permission.

## Retrieving a user's teams

You can list all teams a user belongs to using the `listTeams` or `useTeams` functions or fetch a specific team with `getTeam` or `useTeam`. These functions work on both clients and servers.

<Tabs>
  <Tab title="Client Component">
    ```tsx
    const user = useUser({ or: 'redirect' });
    const allTeams = user.useTeams();
    const someTeam = user.useTeam('some-team-id'); // May be null if the user is not a member of this team

    return (
      <div>
        {allTeams.map(team => (
          <div key={team.id}>{team.displayName}</div>
        ))}
      </div>
      <div>
        {someTeam ? someTeam.displayName : 'Not a member of this team'}
      </div>
    );
    ```

  </Tab>

  <Tab title="Server Component">
    ```tsx
    const user = await stackServerApp.getUser({ or: 'redirect' });
    const allTeams = await user.listTeams();
    const someTeam = await user.getTeam('some-team-id'); // May be null if the user is not a member of this team

    return (
      <div>
        {allTeams.map(team => (
          <div key={team.id}>{team.displayName}</div>
        ))}
      </div>
      <div>
        {someTeam ? someTeam.displayName : 'Not a member of this team'}
      </div>
    ```

  </Tab>
</Tabs>

## Creating a team

To create a team, use the `createTeam` function on the `User` object. The user will be added to the team with the default team creator permissions (You can change this on the permissions tab in the Stack dashboard).

On the client side, this requires enabling the "client side team creation" on the team settings tab in the Stack dashboard.

```jsx
const team = await user.createTeam({
  displayName: "New Team",
});
```

To create a team on the server without adding a specific user, use the `createTeam` function on the `ServerApp` object:

```jsx
const team = await stackServerApp.createTeam({
  displayName: "New Team",
});
```

## Updating a team

You can update a team with the `update` function on the `Team` object.

On the client, the user must have the `$update_team` permission to perform this action.

```tsx
await team.update({
  displayName: "New Name",
});
```

## Custom team metadata

You can store custom metadata on a team object, similar to the user object. The metadata can be any JSON object.

- `clientMetadata`: Can be read and updated on both the client and server sides.
- `serverMetadata`: Can only be read and updated on the server side.
- `clientReadOnlyMetadata`: Can be read on both the client and server sides, but can only be updated on the server side.

```tsx
await team.update({
  clientMetadata: {
    customField: "value",
  },
});

console.log(team.clientMetadata.customField); // 'value'
```

## List users in a team

You can list all users in a team with the `listUsers` function or the `useUsers` hook on the `Team` object. Note that if you want to get the team profile, you need to get it with `user.teamProfile`.

On the client, the current user must have the `$read_members` permission in the team to perform this action.

<Tabs>
  <Tab title="Client Component">
    ```tsx
    // ... retrieve the team and ensure user has the necessary permissions

    const users = team.useUsers();

    return (
      <div>
        {users.map(user => (
          <div key={user.id}>{user.teamProfile.displayName}</div>
        ))}
      </div>
    );
    ```

  </Tab>

  <Tab title="Server Component">
    ```tsx
    // ... retrieve the team

    const users = await team.listUsers();

    return (
      <div>
        {users.map(user => (
          <div key={user.id}>{user.teamProfile.displayName}</div>
        ))}
      </div>
    );
    ```

  </Tab>
</Tabs>

## Get current user's team profile

You can get the current user's team profile with the `getTeamProfile` or `useTeamProfile` function on the `User` object. This function returns the team profile for the team with the given ID.

<Tabs>
  <Tab title="Client Component">
    ```tsx
    const teamProfile = user.useTeamProfile(team);
    ```
  </Tab>
  <Tab title="Server Component">
    ```tsx
    const teamProfile = await user.getTeamProfile(team);
    ```
  </Tab>
</Tabs>

## Invite a user to a team

You can invite a user to a team using the `inviteUser` function on the `Team` object. The user will receive an email with a link to join the team.

On the client side, the current user must have the `$invite_members` permission to perform this action.

```tsx
await team.inviteUser(email);
```

## Adding a user to a team

If you want to add a user to a team without sending an email, use the `addUser` function on the `ServerTeam` object. This function can only be called on the server side.

```tsx
await team.addUser(user.id);
```

## Removing a user from a team

You can remove a user from a team with the `removeUser` function on the `Team` object.

On the client side, the current user must have the `$remove_members` permission to perform this action.

```tsx
await team.removeUser(user.id);
```

## Leaving a team

All users can leave a team without any permissions required.

```tsx
const team = await user.getTeam("some-team-id");
await user.leaveTeam(team);
```

## Deleting a team

You can delete a team with the `delete` function on the `Team` object.

On the client side, the current user must have the `$delete_team` permission to perform this action.

```tsx
await team.delete();
```

---

slug: concepts/team-selection
subtitle: Switch between multiple teams of a user

---

A user can be a member of multiple teams, so most websites using teams will need a way to select a "current team" that the user is working on. There are two primary methods to accomplish this:

- **Deep Link**: Each team has a unique URL, for example, `your-website.com/team/<team-id>`. When a team is selected, it redirects to a page with that team's URL.
- **Current Team**: When a user selects a team, the app stores the team as a global "current team" state. In this way, the URL of the current team might be something like `your-website.com/current-team`, and the URL won't change after switching teams.

## Deep Link Method

The deep link method is generally recommended because it avoids some common issues associated with the current team method. If two users share a link while using deep link URLs, the receiving user will always be directed to the correct team's information based on the link.

## Current Team Method

While the current team method can be simpler to implement, it has a downside. If a user shares a link, the recipient might see information about the wrong team (if their "current team" is set differently). This method can also cause problems when a user has multiple browser tabs open with different teams.

## Selected Team Switcher

To facilitate team selection, Stack provides a component that looks like this:

![TeamSwitcher](file:cfd236b4-a807-4665-ba71-c29cfe0328a0)

You can import and use the `SelectedTeamSwitcher` component for the "current team" method. It updates the `selectedTeam` when a user selects a team:

```jsx
import { SelectedTeamSwitcher } from "@stackframe/stack";

export function MyPage() {
  return (
    <div>
      <SelectedTeamSwitcher />
    </div>
  );
}
```

To combine the switcher with the deep link method, you can pass in `urlMap` and `selectedTeam`. The `urlMap` is a function to generate a URL based on the team information, and `selectedTeam` is the team that the user is currently working on. This lets you implement "deep link" + "most recent team". The component will update the `user.selectedTeam` with the `selectedTeam` prop:

```jsx
<SelectedTeamSwitcher
  urlMap={(team) => `/team/${team.id}`}
  selectedTeam={team}
/>
```

To implement the "deep link" + "default team" method, where you update the `selectedTeam` only when the user clicks "set to default team" or similar, pass `noUpdateSelectedTeam`:

```jsx
<SelectedTeamSwitcher
  urlMap={(team) => `/team/${team.id}`}
  selectedTeam={team}
  noUpdateSelectedTeam
/>
```

## Example: Deep Link + Most Recent Team

First, create a page at `/app/team/[teamId]/page.tsx` to display information about a specific team:

```jsx title="/app/team/[teamId]/page.tsx"
"use client";

import { useUser, SelectedTeamSwitcher } from "@stackframe/stack";

export default function TeamPage({ params }: { params: { teamId: string } }) {
  const user = useUser({ or: "redirect" });
  const team = user.useTeam(params.teamId);

  if (!team) {
    return <div>Team not found</div>;
  }

  return (
    <div>
      <SelectedTeamSwitcher
        urlMap={(team) => `/team/${team.id}`}
        selectedTeam={team}
      />

      <p>Team Name: {team.displayName}</p>
      <p>You are a member of this team.</p>
    </div>
  );
}
```

Next, create a page to display all teams at `/app/team/page.tsx`:

```jsx title="/app/team/page.tsx"
"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";

export default function TeamsPage() {
  const user = useUser({ or: "redirect" });
  const teams = user.useTeams();
  const router = useRouter();
  const selectedTeam = user.selectedTeam;

  return (
    <div>
      {selectedTeam && (
        <button onClick={() => router.push(`/team/${selectedTeam.id}`)}>
          Most recent team
        </button>
      )}

      <h2>All Teams</h2>
      {teams.map((team) => (
        <button key={team.id} onClick={() => router.push(`/team/${team.id}`)}>
          Open {team.displayName}
        </button>
      ))}
    </div>
  );
}
```

## Now, if you navigate to `http://localhost:3000/team`, you should be able to see and interact with the teams.

slug: concepts/permissions
subtitle: Control what each user can do and access with the permission system

---

## Permission Types

Stack supports two types of permissions:

1. **Team Permissions**: Control what a user can do within a specific team
2. **User Permissions**: Control what a user can do globally, across the entire project

Both permission types can be managed from the dashboard, and both support arbitrary nesting.

## Team Permissions

Team permissions control what a user can do within each team. You can create and assign permissions to team members from the Stack dashboard. These permissions could include actions like `create_post` or `read_secret_info`, or roles like `admin` or `moderator`. Within your app, you can verify if a user has a specific permission within a team.

Permissions can be nested to create a hierarchical structure. For example, an `admin` permission can include both `moderator` and `user` permissions. We provide tools to help you verify whether a user has a permission directly or indirectly.

### Creating a Permission

To create a new permission, navigate to the `Team Permissions` section of the Stack dashboard. You can select the permissions that the new permission will contain. Any permissions included within these selected permissions will also be recursively included.

### System Permissions

Stack comes with a few predefined team permissions known as system permissions. These permissions start with a dollar sign (`$`). While you can assign these permissions to members or include them within other permissions, you cannot modify them as they are integral to the Stack backend system.

### Checking if a User has a Permission

To check whether a user has a specific permission, use the `getPermission` method or the `usePermission` hook on the `User` object. This returns the `Permission` object if the user has it; otherwise, it returns `null`. Always perform permission checks on the server side for business logic, as client-side checks can be bypassed. Here's an example:

<Tabs>
  <Tab title="Client Component">
    
    ```tsx title="Check user permission on the client"
    "use client";
    import { useUser } from "@stackframe/stack";

    export function CheckUserPermission() {
      const user = useUser({ or: 'redirect' });
      const team = user.useTeam('some-team-id');
      const permission = user.usePermission(team, 'read');

      // Don't rely on client-side permission checks for business logic.
      return (
        <div>
          {permission ? 'You have the read permission' : 'You shall not pass'}
        </div>
      );
    }
    ```

  </Tab>
  <Tab title="Server Component">
    
    ```tsx title="Check user permission on the server"
    import { stackServerApp } from "@/stack";

    export default async function CheckUserPermission() {
      const user = await stackServerApp.getUser({ or: 'redirect' });
      const team = await stackServerApp.getTeam('some-team-id');
      const permission = await user.getPermission(team, 'read');

      // This is a server-side check, so it's secure.
      return (
        <div>
          {permission ? 'You have the read permission' : 'You shall not pass'}
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

### Listing All Permissions of a User

To get a list of all permissions a user has, use the `listPermissions` method or the `usePermissions` hook on the `User` object. This method retrieves both direct and indirect permissions. Here is an example:

<Tabs>
  <Tab title="Client Component" default>

    ```tsx title="List user permissions on the client"
    "use client";
    import { useUser } from "@stackframe/stack";

    export function DisplayUserPermissions() {
      const user = useUser({ or: 'redirect' });
      const permissions = user.usePermissions();

      return (
        <div>
          {permissions.map(permission => (
            <div key={permission.id}>{permission.id}</div>
          ))}
        </div>
      );
    }
    ```

  </Tab>
  <Tab title="Server Component">

    ```tsx title="List user permissions on the server"
    import { stackServerApp } from "@/stack";

    export default async function DisplayUserPermissions() {
      const user = await stackServerApp.getUser({ or: 'redirect' });
      const permissions = await user.listPermissions();

      return (
        <div>
          {permissions.map(permission => (
            <div key={permission.id}>{permission.id}</div>
          ))}
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

### Granting a Permission to a User

To grant a permission to a user, use the `grantPermission` method on the `ServerUser`. Here's an example:

```tsx
const team = await stackServerApp.getTeam("teamId");
const user = await stackServerApp.getUser();
await user.grantPermission(team, "read");
```

### Revoking a Permission from a User

To revoke a permission from a user, use the `revokePermission` method on the `ServerUser`. Here's an example:

```tsx
const team = await stackServerApp.getTeam("teamId");
const user = await stackServerApp.getUser();
await user.revokePermission(team, "read");
```

## Project Permissions

Project permissions are global permissions that apply to a user across the entire project, regardless of team context. These permissions are useful for handling things like premium plan subscriptions or global admin access.

### Creating a Project Permission

To create a new project permission, navigate to the `Project Permissions` section of the Stack dashboard. Similar to team permissions, you can select other permissions that the new permission will contain, creating a hierarchical structure.

### Checking if a User has a Project Permission

To check whether a user has a specific project permission, use the `getPermission` method or the `usePermission` hook. Here's an example:

<Tabs>
  <Tab title="Client Component">
    
    ```tsx title="Check user permission on the client"
    "use client";
    import { useUser } from "@stackframe/stack";

    export function CheckGlobalPermission() {
      const user = useUser({ or: 'redirect' });
      const permission = user.usePermission('access_admin_dashboard');

      return (
        <div>
          {permission ? 'You can access the admin dashboard' : 'Access denied'}
        </div>
      );
    }
    ```

  </Tab>
  <Tab title="Server Component">
    
    ```tsx title="Check user permission on the server"
    import { stackServerApp } from "@/stack";

    export default async function CheckGlobalPermission() {
      const user = await stackServerApp.getUser({ or: 'redirect' });
      const permission = await user.getPermission('access_admin_dashboard');

      return (
        <div>
          {permission ? 'You can access the admin dashboard' : 'Access denied'}
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

### Listing All Project Permissions

To get a list of all global permissions a user has, use the `listPermissions` method or the `usePermissions` hook:

<Tabs>
  <Tab title="Client Component" default>

    ```tsx title="List global permissions on the client"
    "use client";
    import { useUser } from "@stackframe/stack";

    export function DisplayGlobalPermissions() {
      const user = useUser({ or: 'redirect' });
      const permissions = user.usePermissions();

      return (
        <div>
          {permissions.map(permission => (
            <div key={permission.id}>{permission.id}</div>
          ))}
        </div>
      );
    }
    ```

  </Tab>
  <Tab title="Server Component">

    ```tsx title="List global permissions on the server"
    import { stackServerApp } from "@/stack";

    export default async function DisplayGlobalPermissions() {
      const user = await stackServerApp.getUser({ or: 'redirect' });
      const permissions = await user.listPermissions();

      return (
        <div>
          {permissions.map(permission => (
            <div key={permission.id}>{permission.id}</div>
          ))}
        </div>
      );
    }
    ```

  </Tab>
</Tabs>

### Granting a Project Permission

To grant a global permission to a user, use the `grantPermission` method:

```tsx
const user = await stackServerApp.getUser();
await user.grantPermission("access_admin_dashboard");
```

### Revoking a Project Permission

To revoke a global permission from a user, use the `revokePermission` method:

```tsx
const user = await stackServerApp.getUser();
await user.revokePermission("access_admin_dashboard");
```

By following these guidelines, you can efficiently manage and verify both team and user permissions within your application.

---

slug: concepts/webhooks
subtitle: Syncing team & user data with your backend

---

Webhooks are a powerful way to keep your backend in sync with Stack. They allow you to receive real-time updates when events occur in your Stack project, such as when a user or team is created, updated, or deleted.

For more information and a list of all webhooks, please refer to the [webhook API reference](/rest-api/webhooks).

## Setting up webhooks

In the Stack dashboard, you can create a webhook endpoint in the "Webhooks" section. After creating this endpoint with your server URL, you will start receiving POST requests with a JSON payload at that endpoint. The event payload will look something like this:

```json
{
  "type": "team.created",
  "data": {
    "id": "2209422a-eef7-4668-967d-be79409972c5",
    "display_name": "My Team",
    ...
  }
}
```

## Testing webhooks locally

You can use services like [Svix Playground](https://www.svix.com/play/) or [Webhook.site](https://webhook.site/) to test the receiving of webhooks or relay them to your local development environment.

## Verifying webhooks

To ensure the webhook is coming from Stack (and not from a malicious actor) and is not prone to replay attacks, you should verify the request.

Stack signs the webhook payload with a secret key that you can find in the endpoint details on the dashboard. You can verify the signature using the Svix client library. Check out the [Svix documentation](https://docs.svix.com/receiving/verifying-payloads/how) for instructions on how to verify the signature in JavaScript, Python, Ruby, and other languages. Here is an quick example in JavaScript:

```jsx
import { Webhook } from "svix";

const secret = "<from the dashboard>";
const headers = {
  "svix-id": "<from the webhook request headers>",
  "svix-timestamp": "<from the webhook request headers>",
  "svix-signature": "<from the webhook request headers>",
};
const payload = "<the webhook request body>";

const wh = new Webhook(secret);
// Throws on error, returns the verified content on success
const payload = wh.verify(payload, headers);
```

If you do not want to install the Svix client library or are using a language that is not supported, you can [verify the signature manually](https://docs.svix.com/receiving/verifying-payloads/how-manual).

## Event types

Please refer to the webhook endpoint API reference for more details on the available event types and their payload structures.

- [user.created](/rest-api/webhooks/users/user-created)
- [user.updated](/rest-api/webhooks/users/user-updated)
- [user.deleted](/rest-api/webhooks/users/user-deleted)
- [team.created](/rest-api/webhooks/teams/team-created)
- [team.updated](/rest-api/webhooks/teams/team-updated)
- [team.deleted](/rest-api/webhooks/teams/team-deleted)
- [team_membership.created](/rest-api/webhooks/teams/team-membership-created)
- [team_membership.deleted](/rest-api/webhooks/teams/team-membership-deleted)
- [team_permission.created](/rest-api/webhooks/teams/team-permission-created)
- [team_permission.deleted](/rest-api/webhooks/teams/team-permission-deleted)

## Examples

## Some members of the community have shared their webhook implementations. For example, [here is an example by Clark Gredoña](https://gist.github.com/clarkg/56ffad44949826ae3efe0a431b6021c4) that validates the Webhook schema and update a database user.

slug: concepts/backend-integration
subtitle: Integrate Stack Auth with your own server with the REST APIs

---

To authenticate your endpoints, you need to send the user's access token in the headers of the request to your server, and then make a request to Stack's server API to verify the user's identity.

## Sending requests to your server endpoints

To authenticate your own server endpoints using Stack's server API, you need to protect your endpoints by sending the user's access token in the headers of the request.

On the client side, you can retrieve the access token from the `user` object by calling `user.getAuthJson()`. This will return an object containing `accessToken`.

Then, you can call your server endpoint with these two tokens in the headers, like this:

```typescript
const { accessToken } = await user.getAuthJson();
const response = await fetch("/api/users/me", {
  headers: {
    "x-stack-access-token": accessToken,
  },
  // your other options and parameters
});
```

## Authenticating the user on the server endpoints

Stack Auth provides two methods for authenticating users on your server endpoints:

1. **JWT Verification**: A fast, lightweight approach that validates the user's token locally without making external requests. While efficient, it provides only essential user information encoded in the JWT.
2. **REST API Verification**: Makes a request to Stack Auth's servers to validate the token and retrieve comprehensive user information. This method provides access to the complete, up-to-date user profile.

### Using JWT

<Tabs>
  <Tab title="Node.js">
    ```javascript
    // you need to install the jose library if it's not already installed
    import * as jose from 'jose';

    // you can cache this and refresh it with a low frequency
    const jwks = jose.createRemoteJWKSet(new URL("https://api.stack-auth.com/api/v1/projects/<your-project-id>/.well-known/jwks.json"));

    const accessToken = 'access token from the headers';

    try {
      const { payload } = await jose.jwtVerify(accessToken, jwks);
      console.log('Authenticated user with ID:', payload.sub);
    } catch (error) {
      console.error(error);
      console.log('Invalid user');
    }
    ```

  </Tab>
</Tabs>

### Using the REST API

<Tabs>
  <Tab title="Node.js">
    ```javascript
    const url = 'https://api.stack-auth.com/api/v1/users/me';
    const headers = {
      'x-stack-access-type': 'server',
      'x-stack-project-id': 'generated on the Stack Auth dashboard',
      'x-stack-secret-server-key': 'generated on the Stack Auth dashboard',
      'x-stack-access-token': 'access token from the headers',
    };

    const response = await fetch(url, { headers });
    if (response.status === 200) {
      console.log('User is authenticated', await response.json());
    } else {
      console.log('User is not authenticated', response.status, await response.text());
    }
    ```

  </Tab>

  <Tab title="Python">
   ```python
    import requests

    url = 'https://api.stack-auth.com/api/v1/users/me'
    headers = {
      'x-stack-access-type': 'server',
      'x-stack-project-id': 'generated on the Stack Auth dashboard',
      'x-stack-secret-server-key': 'generated on the Stack Auth dashboard',
      'x-stack-access-token': 'access token from the headers',
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
      print('User is authenticated', response.json())
    else:
      print('User is not authenticated', response.status_code, response.text)
    ```

  </Tab>
</Tabs>
