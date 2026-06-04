import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const dccFormats = sqliteTable('dcc_formats', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	pinCount: integer('pin_count'),
	description: text('description'),
	sortOrder: integer('sort_order').default(0)
});

export const decoderBrands = sqliteTable('decoder_brands', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	website: text('website')
});

export const decoders = sqliteTable('decoders', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	brandId: integer('brand_id').notNull().references(() => decoderBrands.id),
	formatId: integer('format_id').notNull().references(() => dccFormats.id),
	model: text('model').notNull(),
	notes: text('notes'),
	buyUrl: text('buy_url'),
	motor: integer('motor', { mode: 'boolean' }).notNull().default(true),
	lights: integer('lights', { mode: 'boolean' }).notNull().default(true),
	soundDecoder: integer('sound_decoder', { mode: 'boolean' }).default(false)
});

export const trains = sqliteTable('trains', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	manufacturer: text('manufacturer').notNull(),
	scale: text('scale').notNull(),
	roadName: text('road_name'),
	modelNumber: text('model_number').notNull(),
	name: text('name').notNull(),
	era: text('era'),
	notes: text('notes'),
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});

export const trainFormatCompat = sqliteTable('train_format_compat', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	trainId: integer('train_id').notNull().references(() => trains.id, { onDelete: 'cascade' }),
	formatId: integer('format_id').notNull().references(() => dccFormats.id),
	purpose: text('purpose').notNull().default('Motor & Lights'), // 'Motor Only' | 'Lights Only' | 'Motor & Lights'
	notes: text('notes')
});

export const trainDecoderCompat = sqliteTable('train_decoder_compat', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	trainId: integer('train_id').notNull().references(() => trains.id, { onDelete: 'cascade' }),
	decoderId: integer('decoder_id').notNull().references(() => decoders.id, { onDelete: 'cascade' }),
	confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(true),
	notes: text('notes')
});

export const suggestions = sqliteTable('suggestions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').notNull(), // 'add_train' | 'add_decoder' | 'add_compat' | 'correction'
	payload: text('payload').notNull(), // JSON
	submitterNote: text('submitter_note'),
	submitterEmail: text('submitter_email'),
	status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
	adminNote: text('admin_note'),
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});
