# Stack Auth - Next.js SDK Setup Guide

Welcome to the Next.js SDK setup guide. If you're looking for guides for other frameworks, check out the [React SDK Setup](#) or the [JavaScript SDK Setup](#).

## Setup

> **Note:** Stack Auth only supports the **App Router** in Next.js, not the **Pages Router**.

We recommend using our **setup wizard** for a seamless installation experience. The wizard auto-detects your project structure and guides you through the setup process. If you hit any issues, follow the **manual installation** steps.

### 🪄 Setup Wizard (Recommended)

1. Run Stack's installation wizard:

   ```bash
   npx @stackframe/init-stack@latest
   ```

2. Create an account on the [Stack Auth Dashboard](https://stack-auth.com), create a new project, and copy your API keys into your `.env.local` file:

   ```env
   NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
   STACK_SECRET_SERVER_KEY=<your-secret-server-key>
   ```

3. That's it! The following files should now exist or be updated:

   - `app/handler/[...stack]/page.tsx`: Default pages (sign-in, sign-out, account settings, etc.)
   - `app/layout.tsx`: Updated to wrap with `StackProvider` and `StackTheme`
   - `app/loading.tsx`: Adds a Suspense boundary if missing (used for async hooks like `useUser`)
   - `stack.ts`: Exposes `stackServerApp` for use in server components, actions, API routes, and middleware

## Post-setup

Now that Stack is configured, run your app:

```bash
npm run dev
```

Then visit:

- `http://localhost:3000/handler/signup` — Sign-up page
- `http://localhost:3000/handler/account-settings` — Account settings page

After signing in, you'll be redirected back to the home page. We'll cover how to show user info and protect pages in the next section.

---

## Next Steps

- Learn how to retrieve and update user information
- Protect a page from unauthorized access

---

**Was this page helpful?**

- [ ] Yes
- [ ] No

**Navigation:**

- ⬅️ [Previous: Components](#)
- ➡️ [Next: Installation & Setup](#)

```

```

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

In the next guide, we will show you how to put [your application into production](/getting-started/production).

---

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

slug: concepts/orgs-and-teams
subtitle: Manage teams and team members

---

---

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

Some members of the community have shared their webhook implementations. For example, [here is an example by Clark Gredoña](https://gist.github.com/clarkg/56ffad44949826ae3efe0a431b6021c4) that validates the Webhook schema and update a database user.

---

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
