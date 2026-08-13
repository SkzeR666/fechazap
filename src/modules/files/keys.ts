import { randomUUID } from "node:crypto";

export type FileCategory =
  "brand" | "image" | "attachment" | "quote_pdf" | "contract";
type FileCoordinates = {
  userId: string;
  customerId?: string;
  quoteId?: string;
  category: FileCategory;
  extension: string;
};

const cleanExtension = (extension: string) =>
  extension.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";

export function fileKey(input: FileCoordinates) {
  const root = `users/${input.userId}`;
  const extension = cleanExtension(input.extension);
  if (input.category === "brand")
    return `${root}/brand/logos/${randomUUID()}.${extension}`;
  if (!input.customerId) throw new Error("customer_id_required");
  const customerRoot = `${root}/customers/${input.customerId}`;
  if (input.category === "image")
    return `${customerRoot}/images/${randomUUID()}.${extension}`;
  if (input.category === "attachment")
    return `${customerRoot}/attachments/${randomUUID()}.${extension}`;
  if (!input.quoteId) throw new Error("quote_id_required");
  if (input.category === "quote_pdf")
    return `${customerRoot}/quotes/${input.quoteId}/pdfs/quote-${randomUUID()}.pdf`;
  return `${customerRoot}/quotes/${input.quoteId}/contracts/contract.pdf`;
}
