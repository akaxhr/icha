export function isAdminAllowed(req) {
  if (!process.env.ADMIN_PASSWORD) return true;

  const q = req.query || {};

  return (
    req.headers["x-admin-password"] === process.env.ADMIN_PASSWORD ||
    req.body?.admin_password === process.env.ADMIN_PASSWORD ||
    q.admin_password === process.env.ADMIN_PASSWORD
  );
}
