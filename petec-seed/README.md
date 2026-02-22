# Petec Migration Bundle (Postgres -> MongoDB, Petec V2)

Everything you need to migrate the legacy Postgres dump (`PETEC-SCRIPT.pgsql`) into the **Petec V2** MongoDB schema.

## Files
- `petec_pgsql_to_mongo_seed.js`  Main converter: reads pg_dump COPY blocks and inserts into Mongo.
- `seed_from_sql_snippet.js`      Seeds baseline rows from the SQL snippet (safe upserts).
- `create_indexes.js`             Creates indexes.
- `compute_case_notifications.js` Sample aggregation replacing the legacy VIEW `case_notifications`.
- `.env.example`                  Env template.
- `package.json`                  Dependencies + scripts.
- `README_CONVERTER.md`           Notes about the converter.

## Quick start
```bash
npm i
cp .env.example .env
# edit .env if needed

# 1) Convert + insert from pg_dump:
node petec_pgsql_to_mongo_seed.js --input ./PETEC-SCRIPT.pgsql --mongo $MONGODB_URI --db $MONGODB_DB

# 2) Create indexes:
node create_indexes.js --mongo $MONGODB_URI --db $MONGODB_DB
```

## Optional
Seed extra snippet values:
```bash
node seed_from_sql_snippet.js --mongo $MONGODB_URI --db $MONGODB_DB
```

Compute notifications (view replacement):
```bash
node compute_case_notifications.js --mongo $MONGODB_URI --db $MONGODB_DB --hours 12
```
