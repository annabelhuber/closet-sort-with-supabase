import Link from "next/link";
import { redirect } from "next/navigation";

import { ClothingItemCard } from "@/components/closet/clothing-item-card";
import { Button } from "@/components/ui/button";
import { getClothingItems } from "@/lib/db/clothing";
import { BUCKETS } from "@/lib/storage/paths";
import { getSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

export default async function ViewClosetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const items = await getClothingItems(user.id);
  const closetItems = await Promise.all(
    items.map(async (item) => ({
      item,
      imageUrl: await getSignedUrl(BUCKETS.display, item.display_image_path),
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My closet</h1>
          <p className="mt-2 text-muted-foreground">
            Your saved clothing items.
          </p>
        </div>
        <Button asChild>
          <Link href="/add-new">Add new items</Link>
        </Button>
      </div>

      {closetItems.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your closet is empty. Upload a photo to add your first items.
          </p>
          <Button asChild>
            <Link href="/add-new">Add new items</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {closetItems.map(({ item, imageUrl }) => (
            <ClothingItemCard key={item.id} item={item} imageUrl={imageUrl} />
          ))}
        </div>
      )}
    </div>
  );
}
