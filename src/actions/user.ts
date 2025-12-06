import db from "@/db";
import { usersTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getOrCreateUser() {
  const user = await currentUser();
  if (!user) return null;
  try {
    const existUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, user.id))
      .limit(1);

    if (existUser[0]) {
      return existUser[0];
    }

    const name = user.fullName || "";
    const username =
      "@" + user.fullName?.toLowerCase().replace(/ /g, "") + "-" + Date.now();

    const email = user.emailAddresses[0]?.emailAddress || "";
    const imageUrl = user.imageUrl || "";

    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId: user.id,
        email: email,
        username: username,
        imageUrl: imageUrl,
        name,
      })
      .returning();

    return newUser;
  } catch (error) {
    if (error instanceof Error) {
      // Error handled silently
    }
    return null;
  }
}
