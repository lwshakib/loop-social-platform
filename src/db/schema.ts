import { relations, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// --------------------
// Tables
// --------------------

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  clerkId: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull().unique(),
  imageUrl: varchar({ length: 255 }).notNull(),
  bio: text().notNull().default(""),
  dateOfBirth: date(),
  gender: varchar({ length: 255 }).notNull().default(""),
  isVerified: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  content: text().notNull(),
  imageUrl: varchar({ length: 255 }).notNull().default(""),
  type: varchar({ length: 255 }).notNull().default("text"),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  postId: uuid()
    .references(() => postsTable.id, { onDelete: "cascade" })
    .notNull(),
  content: text().notNull(),
  parentId: uuid().references((): AnyPgColumn => commentsTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const likesTable = pgTable(
  "likes",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    postId: uuid()
      .references(() => postsTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    likeUnique: uniqueIndex("likes_user_post_unique").on(
      table.userId,
      table.postId
    ),
  })
);

export const bookmarksTable = pgTable(
  "bookmarks",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    postId: uuid()
      .references(() => postsTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    bookmarkUnique: uniqueIndex("bookmarks_user_post_unique").on(
      table.userId,
      table.postId
    ),
  })
);

export const followsTable = pgTable(
  "follows",
  {
    id: uuid().primaryKey().defaultRandom(),
    followingUserId: uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(), // the one who follows
    followedUserId: uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(), // the one being followed
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    followUnique: uniqueIndex("follows_following_followed_unique").on(
      table.followingUserId,
      table.followedUserId
    ),
  })
);

export const notificationsTable = pgTable("notifications", {
  id: uuid().primaryKey().defaultRandom(),
  // receiver of the notification
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  // actor that triggered the notification
  actionUserId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  postId: uuid().references(() => postsTable.id, { onDelete: "cascade" }),
  commentId: uuid().references(() => commentsTable.id, { onDelete: "cascade" }),
  type: varchar({ length: 50 }).notNull(), // e.g. "like", "comment", "follow"
  isRead: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

export const storiesTable = pgTable("stories", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  url: varchar({ length: 255 }).notNull(),
  caption: text().notNull().default(""),
  expiresAt: timestamp()
    .notNull()
    .default(sql`now() + interval '1 day'`),
  createdAt: timestamp().notNull().defaultNow(),
});


export const searchHistoryTable = pgTable("search_history", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  searchTerm: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});



// --------------------
// Relations
// --------------------

export const userRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
  comments: many(commentsTable),
  likes: many(likesTable),
  bookmarks: many(bookmarksTable),

  // users this user is following
  following: many(followsTable, { relationName: "following" }),
  // users who follow this user
  followers: many(followsTable, { relationName: "followers" }),

  // notifications this user receives
  notifications: many(notificationsTable, { relationName: "notifications" }),
  // notifications this user triggers as actor
  notificationActions: many(notificationsTable, { relationName: "actions" }),

  stories: many(storiesTable),
  searchHistory: many(searchHistoryTable),
}));

export const postRelations = relations(postsTable, ({ many, one }) => ({
  comments: many(commentsTable),
  likes: many(likesTable),
  bookmarks: many(bookmarksTable),
  notifications: many(notificationsTable),
  user: one(usersTable, {
    fields: [postsTable.userId],
    references: [usersTable.id],
  }),
}));

export const commentRelations = relations(commentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
  post: one(postsTable, {
    fields: [commentsTable.postId],
    references: [postsTable.id],
  }),
  parent: one(commentsTable, {
    fields: [commentsTable.parentId],
    references: [commentsTable.id],
  }),
}));

export const likeRelations = relations(likesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [likesTable.userId],
    references: [usersTable.id],
  }),
  post: one(postsTable, {
    fields: [likesTable.postId],
    references: [postsTable.id],
  }),
}));

export const bookmarkRelations = relations(bookmarksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [bookmarksTable.userId],
    references: [usersTable.id],
  }),
  post: one(postsTable, {
    fields: [bookmarksTable.postId],
    references: [postsTable.id],
  }),
}));

export const followRelations = relations(followsTable, ({ one }) => ({
  // the follower
  following: one(usersTable, {
    fields: [followsTable.followingUserId],
    references: [usersTable.id],
    relationName: "following",
  }),
  // the followed
  followed: one(usersTable, {
    fields: [followsTable.followedUserId],
    references: [usersTable.id],
    relationName: "followers",
  }),
}));

export const notificationRelations = relations(
  notificationsTable,
  ({ one }) => ({
    // receiver
    user: one(usersTable, {
      fields: [notificationsTable.userId],
      references: [usersTable.id],
      relationName: "notifications",
    }),
    // actor
    actionUser: one(usersTable, {
      fields: [notificationsTable.actionUserId],
      references: [usersTable.id],
      relationName: "actions",
    }),
    post: one(postsTable, {
      fields: [notificationsTable.postId],
      references: [postsTable.id],
    }),
    comment: one(commentsTable, {
      fields: [notificationsTable.commentId],
      references: [commentsTable.id],
    }),
  })
);

export const storyRelations = relations(storiesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [storiesTable.userId],
    references: [usersTable.id],
  }),
}));


export const searchHistoryRelations = relations(
  searchHistoryTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [searchHistoryTable.userId],
      references: [usersTable.id],
    }),
  })
);