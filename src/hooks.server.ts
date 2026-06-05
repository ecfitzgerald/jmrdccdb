// Importing the env module executes the ADMIN_PASSWORD boot-time guard at
// server startup. Route modules load lazily, so hooks.server.ts is the earliest
// reliable point to fail fast on an insecure/missing admin password.
import '$lib/server/env';
