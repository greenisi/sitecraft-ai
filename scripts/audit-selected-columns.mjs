/**
 * Finds Supabase selects that name a column the database does not have.
 *
 * This class of bug has bitten twice in one file and both times it was
 * invisible: PostgREST errors, the caller does not check .error, `data` is
 * null, and null reads downstream as "empty" rather than "broken". The setup
 * checklist looked stubborn for weeks; the Stripe step could never be ticked.
 *
 * Prints every (table, column) pair it can extract statically. Pipe the SQL it
 * emits into the database to get the list of pairs that do not exist:
 *
 *   node scripts/audit-selected-columns.mjs --sql
 *
 * Without --sql it just lists what it found, which is useful for checking the
 * extractor itself is seeing your query.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'src';

/** Table names that are not real tables, or are resolved at runtime. */
const SKIP_TABLES = new Set(['rpc']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.(ts|tsx)$/.test(path)) out.push(path);
  }
  return out;
}

/**
 * Matches `.from('table')` followed by `.select('cols')`, allowing whitespace
 * and newlines between them. Deliberately conservative: anything dynamic or
 * unparseable is skipped rather than guessed at, so this under-reports rather
 * than crying wolf.
 */
const FROM_SELECT = /\.from\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*\)\s*(?:\r?\n\s*)*\.select\(\s*(['"`])([\s\S]*?)\2/g;

const pairs = new Map(); // "table.column" -> Set of files

for (const file of walk(ROOT)) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(FROM_SELECT)) {
    const [, table, , rawCols] = match;
    if (SKIP_TABLES.has(table)) continue;
    if (rawCols.includes('${')) continue; // dynamic column list

    // Strip embedded relationship selects -- `assets(public_url, file_type)`
    // names another table's columns and is checked separately by PostgREST.
    const flattened = rawCols.replace(/[a-z_][a-z0-9_]*\s*\([^)]*\)/gi, '');

    for (let col of flattened.split(',')) {
      col = col.trim();
      if (!col || col === '*') continue;
      // `count`, aliases and modifiers are not plain columns.
      if (col.includes(':') || col.includes('!') || col.includes('.')) continue;
      if (!/^[a-z_][a-z0-9_]*$/.test(col)) continue;
      const key = `${table}.${col}`;
      if (!pairs.has(key)) pairs.set(key, new Set());
      pairs.get(key).add(file);
    }
  }
}

const sorted = [...pairs.keys()].sort();

if (process.argv.includes('--sql')) {
  const values = sorted
    .map((key) => {
      const [table, col] = key.split('.');
      return `('${table}','${col}')`;
    })
    .join(',\n  ');

  console.log(`with needed(tbl, col) as (values
  ${values}
)
select n.tbl, n.col
from needed n
left join information_schema.columns c
  on c.table_schema='public' and c.table_name=n.tbl and c.column_name=n.col
left join information_schema.tables t
  on t.table_schema='public' and t.table_name=n.tbl
where c.column_name is null and t.table_name is not null
order by n.tbl, n.col;`);
} else {
  console.log(`${sorted.length} (table, column) pairs across ${new Set([...pairs.values()].flatMap((s) => [...s])).size} files\n`);
  for (const key of sorted) console.log('  ' + key);
}
