import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Button asChild className="w-full">
        <Link href="/view-closet">View My Closet</Link>
      </Button>
      <Button asChild className="w-full" variant="outline">
        <Link href="/add-new">Add New Items</Link>
      </Button>
    </div>
  );
}
