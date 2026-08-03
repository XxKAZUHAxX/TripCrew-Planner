const ALLOWED_METHODS = ['GET', 'HEAD'];

// Serves objects straight out of the `tripcrewplanner` R2 bucket on this
// Worker's free workers.dev URL. Replaces the shared r2.dev public URL,
// which some ISPs/networks time out on. Object keys map 1:1 to bucket paths,
// e.g. GET /destinations/<destId>/<file>.webp.
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (!ALLOWED_METHODS.includes(request.method)) {
            return new Response('Method Not Allowed', {
                status: 405,
                headers: { Allow: ALLOWED_METHODS.join(', ') },
            });
        }

        const url = new URL(request.url);
        const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
        if (!key) {
            return new Response('Not Found', { status: 404 });
        }

        const ifNoneMatch = request.headers.get('if-none-match');
        const object = await env.BUCKET.get(key, {
            onlyIf: ifNoneMatch ? { etagDoesNotMatch: ifNoneMatch } : undefined,
        });

        if (object === null) {
            return new Response('Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('cache-control', 'public, max-age=31536000, immutable');
        headers.set('access-control-allow-origin', '*');

        // No body means the conditional check matched — content is unchanged.
        if (!('body' in object) || object.body === null) {
            return new Response(null, { status: 304, headers });
        }

        if (request.method === 'HEAD') {
            return new Response(null, { status: 200, headers });
        }

        return new Response(object.body, { status: 200, headers });
    },
};
