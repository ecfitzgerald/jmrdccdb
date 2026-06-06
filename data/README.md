# data/

SQLite database for the JMR DCC Compatibility app. Managed by Drizzle ORM — migrations live in `../drizzle/`.

Seed reference data: `npm run db:seed`  
Import Kato XLSX: `npx tsx src/lib/db/import-kato-xlsx.ts <path.xlsx>`

## Schema

```
operators                    train_types                  dcc_formats
─────────────────────        ─────────────────────        ─────────────────────
id PK                        id PK                        id PK
name UNIQUE                  name UNIQUE                  name UNIQUE
sort_order                   sort_order                   pin_count
                                                          description
                                                          sort_order

decoder_brands
─────────────────────
id PK
name UNIQUE
website


trains ──────────────────────────────────────────────────────────────────────────
id PK
manufacturer
scale
operator_id ──────────────────────────────────────────────────────► operators.id
model_number
name
line
type_id ──────────────────────────────────────────────────────────► train_types.id
era
notes
created_at


decoders
─────────────────────────────────────────────────────────────────────────────────
id PK
brand_id ──────────────────────────────────────────────────────────► decoder_brands.id
format_id ─────────────────────────────────────────────────────────► dcc_formats.id
model                        UNIQUE (brand_id, model)
notes
buy_url
motor
lights
sound_decoder


train_format_compat          ← which DCC board formats a train accepts
─────────────────────────────────────────────────────────────────────────────────
id PK
train_id ──────────────────────────────────────────────────────────► trains.id  (cascade delete)
format_id ─────────────────────────────────────────────────────────► dcc_formats.id
purpose                      'Motor Only' | 'Lights Only' | 'Motor & Lights'
notes                        UNIQUE (train_id, format_id)


train_decoder_compat         ← specific decoders confirmed to work with a train
─────────────────────────────────────────────────────────────────────────────────
id PK
train_id ──────────────────────────────────────────────────────────► trains.id  (cascade delete)
decoder_id ────────────────────────────────────────────────────────► decoders.id (cascade delete)
confirmed
notes


suggestions                  ← user-submitted additions / corrections (pending review)
─────────────────────────────────────────────────────────────────────────────────
id PK
type                         'add_train' | 'add_decoder' | 'add_compat' | 'correction'
payload                      JSON
submitter_note
submitter_email
status                       'pending' | 'approved' | 'rejected'
admin_note
created_at
```
