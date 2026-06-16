import { UploadPhotoForm } from "@/components/add-new/upload-photo-form";

export default function AddNewPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Add new items</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a photo of your clothes. We will detect and crop each item for
          you to review.
        </p>
      </div>
      <UploadPhotoForm />
    </div>
  );
}
