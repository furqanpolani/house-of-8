// The admin "token" is the admin password itself (simple, stateless).
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function isAdmin(req) {
  return Boolean(ADMIN_PASSWORD) && req.headers['x-admin-token'] === ADMIN_PASSWORD;
}
