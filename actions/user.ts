import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

type UpdateUserProfileInput = {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
  coverImage?: string;
};

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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  const payload: UpdateUserProfileInput = {};
  if (typeof input.name === "string") payload.name = input.name.trim();
  if (typeof input.username === "string")
    payload.username = input.username.trim();
  if (typeof input.bio === "string") payload.bio = input.bio;
  if (typeof input.image === "string") payload.image = input.image.trim();
  if (typeof input.coverImage === "string")
    payload.coverImage = input.coverImage.trim();

  if (Object.keys(payload).length === 0) {
    throw new Error("No fields to update");
  }

  const updated = await prisma.user.update({
    where: { id: dbUser.id },
    data: payload,
  });

  return updated;
}
