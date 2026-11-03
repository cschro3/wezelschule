import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
 id: text('id').primaryKey(), identity: text('identity').unique(), email: text('email').notNull().unique(), name: text('name').notNull(), role: text('role').notNull(), active: integer('active').notNull().default(1), createdAt: text('created_at').notNull()
});
export const entries = sqliteTable('entries', {
 id: text('id').primaryKey(), kind: text('kind').notNull(), slug: text('slug').notNull(), title: text('title').notNull(), excerpt: text('excerpt').notNull().default(''), body: text('body').notNull().default(''), blocks:text('blocks'), draft:text('draft'), draftStatus:text('draft_status').notNull().default('draft'), category: text('category').notNull().default('Schule'), status: text('status').notNull().default('draft'), image: text('image'), source: text('source'), rights: integer('rights').notNull().default(0), publishAt: text('publish_at'), startsAt: text('starts_at'), endsAt: text('ends_at'), location: text('location'), recurrence: text('recurrence').notNull().default('none'), recurrenceCount: integer('recurrence_count').notNull().default(1), seoTitle: text('seo_title'), seoDescription: text('seo_description'), authorId: text('author_id').references(()=>users.id), version: integer('version').notNull().default(1), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull()
}, t=>[uniqueIndex('entries_route').on(t.kind,t.slug),index('entries_public').on(t.status,t.kind,t.publishAt)]);
export const revisions = sqliteTable('revisions', {
 id:text('id').primaryKey(),entryId:text('entry_id').notNull().references(()=>entries.id),version:integer('version').notNull(),snapshot:text('snapshot').notNull(),actorId:text('actor_id').notNull().references(()=>users.id),createdAt:text('created_at').notNull()
});
export const media = sqliteTable('media', {
 id:text('id').primaryKey(),key:text('key').notNull().unique(),metadata:text('metadata'),name:text('name').notNull(),type:text('type').notNull(),bytes:integer('bytes').notNull(),alt:text('alt').notNull(),rights:text('rights').notNull(),approved:integer('approved').notNull().default(0),version:integer('version').notNull().default(1),uploaderId:text('uploader_id').notNull().references(()=>users.id),createdAt:text('created_at').notNull()
});
export const settings = sqliteTable('settings', {key:text('key').primaryKey(),value:text('value').notNull(),version:integer('version').notNull().default(1),updatedAt:text('updated_at').notNull()});
export const audit = sqliteTable('audit', {id:text('id').primaryKey(),actorId:text('actor_id'),action:text('action').notNull(),target:text('target').notNull(),createdAt:text('created_at').notNull()});
export const limits = sqliteTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),window:integer('window').notNull()});

export const designDrafts=sqliteTable('design_drafts',{id:text('id').primaryKey(),payload:text('payload').notNull(),version:integer('version').notNull().default(1),baseVersion:integer('base_version').notNull(),state:text('state').notNull().default('draft'),actorId:text('actor_id').references(()=>users.id),updatedAt:text('updated_at').notNull()});
export const designHistory=sqliteTable('design_history',{id:text('id').primaryKey(),version:integer('version').notNull().unique(),snapshot:text('snapshot').notNull(),actorId:text('actor_id').references(()=>users.id),createdAt:text('created_at').notNull()});
