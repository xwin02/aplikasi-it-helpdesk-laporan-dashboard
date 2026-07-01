import { mysqlTable, int, varchar, text, longtext, boolean, timestamp } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const tickets = mysqlTable('tickets', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  category: varchar('category', { length: 100 }).notNull(),
  requesterName: varchar('requester_name', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  assignedTo: varchar('assigned_to', { length: 255 }),
  userId: varchar('user_id', { length: 255 }).references(() => user.id),
  resolution: text('resolution'), // Solution/cara penyelesaian untuk pembelajaran
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  resolvedAt: timestamp('resolved_at').default(sql`NULL`),
});

export const knowledgeBase = mysqlTable('knowledge_base', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: longtext('content').notNull(), // Changed from text() to longtext() for storing articles with base64 images
  category: varchar('category', { length: 100 }).notNull(),
  tags: text('tags'),
  author: varchar('author', { length: 255 }).notNull(),
  attachments: longtext('attachments'), // LONGTEXT for large file attachments
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});


// Auth tables for better-auth
export const user = mysqlTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified")
    .default(false)
    .notNull(),
  image: text("image"),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  securityAnswer: varchar("security_answer", { length: 255 }), // Hashed security answer
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .onUpdateNow(),
});

export const session = mysqlTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = mysqlTable("account", {
  id: varchar("id", { length: 255 }).primaryKey(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 255 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const projects = mysqlTable('projects', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('backlog'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  assignedTo: varchar('assigned_to', { length: 255 }).references(() => user.id),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => user.id),
  dueDate: timestamp('due_date').default(sql`NULL`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const tasks = mysqlTable('tasks', {
  id: int('id').primaryKey().autoincrement(),
  projectId: int('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('todo'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  assignedTo: varchar('assigned_to', { length: 255 }).references(() => user.id),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => user.id),
  startDate: timestamp('start_date').default(sql`NULL`),
  dueDate: timestamp('due_date').default(sql`NULL`),
  estimatedHours: int('estimated_hours'),
  actualHours: int('actual_hours'),
  progress: int('progress').default(0),
  order: int('order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  completedAt: timestamp('completed_at').default(sql`NULL`),
});

export const subtasks = mysqlTable('subtasks', {
  id: int('id').primaryKey().autoincrement(),
  taskId: int('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  completed: boolean('completed').default(false),
  order: int('order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const taskComments = mysqlTable('task_comments', {
  id: int('id').primaryKey().autoincrement(),
  taskId: int('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const taskAttachments = mysqlTable('task_attachments', {
  id: int('id').primaryKey().autoincrement(),
  taskId: int('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: int('file_size').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const taskActivities = mysqlTable('task_activities', {
  id: int('id').primaryKey().autoincrement(),
  taskId: int('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  action: varchar('action', { length: 255 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const milestones = mysqlTable('milestones', {
  id: int('id').primaryKey().autoincrement(),
  projectId: int('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date').notNull(),
  completed: boolean('completed').default(false),
  order: int('order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  completedAt: timestamp('completed_at').default(sql`NULL`),
});

export const projectMembers = mysqlTable('project_members', {
  id: int('id').primaryKey().autoincrement(),
  projectId: int('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});