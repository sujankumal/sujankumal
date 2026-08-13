// Route entry-point — Next.js reads named HTTP-method exports from this file.
// All logic lives in the co-located handler modules (prefixed with `_` so that
// Next.js does not treat them as route segments).

export { GET } from "./_get.handler";
export { POST } from "./_post.handler";
export { PUT } from "./_put.handler";
export { DELETE } from "./_delete.handler";
