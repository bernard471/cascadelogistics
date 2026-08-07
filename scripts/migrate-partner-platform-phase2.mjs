import { MongoClient } from "mongodb";
import { runPhase2Migration } from "../src/lib/partner-platform/migration.ts";

function argument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

const databaseName = argument("database");
const apply = process.argv.includes("--apply");

if (!databaseName) {
  throw new Error("Pass --database=<explicit-test-database-name>");
}
if (!process.env.MONGO) {
  throw new Error("MONGO is required");
}

const client = new MongoClient(process.env.MONGO);
try {
  await client.connect();
  const report = await runPhase2Migration({
    db: client.db(databaseName),
    databaseName,
    dryRun: !apply,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.reconciled) process.exitCode = 1;
} finally {
  await client.close();
}
