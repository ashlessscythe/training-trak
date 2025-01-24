import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PendingPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">
            Account Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your account is currently pending approval from an administrator.
          </p>
          <p className="text-center text-muted-foreground">
            You will receive an email notification once your account has been
            reviewed.
          </p>
          <p className="text-center text-muted-foreground">
            Thank you for your patience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
