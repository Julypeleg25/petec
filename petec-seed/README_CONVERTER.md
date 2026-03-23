# Petec pg_dump -> MongoDB Converter

This converter reads PostgreSQL `pg_dump` text format `COPY` blocks and inserts the data into MongoDB using the Petec V2 schema.

- It migrates only mapped Petec V2 fields.
- It does **not** store raw legacy rows.

Run (changes in DB):
```bash
node petec_pgsql_to_mongo_seed.js --input ./PETEC-SCRIPT.pgsql --mongo mongodb://localhost:27017 --db petec
```

Dry run (no changes in DB):
```bash
node petec_pgsql_to_mongo_seed.js --input ./PETEC-SCRIPT.pgsql --dry
```


## V4 note
This bundle updates the converter to match the actual column names in your PETEC-SCRIPT.pgsql dump (e.g. created_by, frequency_id, procedure_id, quoted case table) and uses robust Postgres date parsing.
