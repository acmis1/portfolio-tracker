import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  revalidatePath("/");
  revalidatePath("/holdings/[id]", "page");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
