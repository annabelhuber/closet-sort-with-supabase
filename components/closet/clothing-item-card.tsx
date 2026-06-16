import type { ClothingItem } from "@/types/database";

export function ClothingItemCard({
  item,
  imageUrl,
}: {
  item: ClothingItem;
  imageUrl: string;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <img
        src={imageUrl}
        alt={item.name ?? item.category ?? "Clothing item"}
        className="h-48 w-full object-contain bg-muted"
      />
      <div className="p-3 space-y-1 text-sm">
        <p className="font-medium">{item.name ?? item.category ?? "Untitled item"}</p>
        {item.brand ? <p className="text-muted-foreground">{item.brand}</p> : null}
        {item.size ? <p className="text-muted-foreground">Size: {item.size}</p> : null}
        {item.color ? <p className="text-muted-foreground">Color: {item.color}</p> : null}
      </div>
    </div>
  );
}
