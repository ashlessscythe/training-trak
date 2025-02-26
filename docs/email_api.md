# Resend - Next.js Guide

## Prerequisites

To get the most out of this guide, you’ll need to:

- Create an API key
- Verify your domain

---

## 1. Install

Get the Resend Node.js SDK:

```sh
npm install resend
```

---

## 2. Create an Email Template

Start by creating your email template in `components/email-template.tsx`:

```tsx
import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div>
    <h1>Welcome, {firstName}!</h1>
  </div>
);
```

---

## 3. Send Email Using React

Create an API file under `pages/api/send.ts` if you’re using the **Pages Router**, or create a route file under `app/api/send/route.ts` if you’re using the **App Router**.

Import the React email template and send an email using the `react` parameter:

```ts
import { EmailTemplate } from "../../../components/EmailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "Hello world",
      react: EmailTemplate({ firstName: "John" }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
```

---

## 4. Try it Yourself

### Next.js Example (Pages Router)

See the full source code.

### Next.js Example (App Router)

See the full source code.

---

## Resources

- [Introduction](#prerequisites)
- [Remix](#remix)
- [Twitter](https://twitter.com)
- [GitHub](https://github.com)
- [Discord](https://discord.com)
- [Website](https://resend.dev)

---

## On This Page

- [Prerequisites](#prerequisites)
- [1. Install](#1-install)
- [2. Create an Email Template](#2-create-an-email-template)
- [3. Send Email Using React](#3-send-email-using-react)
- [4. Try it Yourself](#4-try-it-yourself)
