export function ok(res, data, message = 'success') {
  return res.json({ success: true, message, data });
}

export function created(res, data, message = 'created') {
  return res.status(201).json({ success: true, message, data });
}

export function fail(res, status, message) {
  return res.status(status).json({ success: false, message, data: null });
}

export function badRequest(res, message) {
  return fail(res, 400, message);
}

export function notFound(res, message = 'Not found') {
  return fail(res, 404, message);
}

export function unauthorized(res, message = 'Unauthorized') {
  return fail(res, 401, message);
}

export function forbidden(res, message = 'Forbidden') {
  return fail(res, 403, message);
}
