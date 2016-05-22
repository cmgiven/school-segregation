// Require every file in provided context as an array
export function requireAll(req) { return req.keys().map(req); }
