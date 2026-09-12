import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const formRateLimits=sqliteTable('form_rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull()});
export const orders=sqliteTable('orders',{id:text('id').primaryKey(),status:text('status').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),version:integer('version').notNull().default(1),data:text('data').notNull()},t=>[index('orders_status_created').on(t.status,t.createdAt),index('orders_created').on(t.createdAt)]);
export const studioSettings=sqliteTable('studio_settings',{key:text('key').primaryKey(),version:integer('version').notNull().default(1),data:text('data').notNull()});
export const coupons=sqliteTable('coupons',{code:text('code').primaryKey(),version:integer('version').notNull().default(1),used:integer('used').notNull().default(0),data:text('data').notNull()});
export const siteEvents=sqliteTable('site_events',{key:text('key').primaryKey(),day:text('day').notNull(),kind:text('kind').notNull(),count:integer('count').notNull().default(0)},t=>[index('site_events_day').on(t.day)]);
