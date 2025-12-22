import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

type UpdateUserProfileInput = {
  name?: string;
  username?: string;
  bio?: string;
  imageUrl?: string;
  coverImageUrl?: string;
};

export async function getOrCreateUser() {
  const user = await currentUser();
  if (!user) return null;
  try {
    const existUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (existUser) {
      return existUser;
    }

    const name = user.fullName || "";
    const username =
      "@" + user.fullName?.toLowerCase().replace(/ /g, "") + "-" + Date.now();

    const email = user.emailAddresses[0]?.emailAddress || "";
    const imageUrl = user.imageUrl || "";

    const newUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email: email,
        username: username,
        imageUrl: imageUrl,
        name,
      },
    });

    return newUser;
  } catch (error) {
    if (error instanceof Error) {
      // Error handled silently
    }
    return null;
  }
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    postsCount: user._count.posts,
  };
}

export async function updateUserProfile(input: UpdateUserProfileInput) {
  const authUser = await currentUser();
  if (!authUser) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: authUser.id },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  const payload: UpdateUserProfileInput = {};
  if (typeof input.name === "string") payload.name = input.name.trim();
  if (typeof input.username === "string")
    payload.username = input.username.trim();
  if (typeof input.bio === "string") payload.bio = input.bio;
  if (typeof input.imageUrl === "string")
    payload.imageUrl = input.imageUrl.trim();
  if (typeof input.coverImageUrl === "string")
    payload.coverImageUrl = input.coverImageUrl.trim();

  if (Object.keys(payload).length === 0) {
    throw new Error("No fields to update");
  }

  const updated = await prisma.user.update({
    where: { id: dbUser.id },
    data: payload,
  });

  return updated;
}
