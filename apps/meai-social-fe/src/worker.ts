export default {
    async fetch(request: Request, env: any): Promise<Response> {
        // const url = new URL(request.url);
        const response = await env.ASSETS.fetch(request);

        // If the asset is not found (404), serve index.html for SPA routing
        if (response.status === 404) {
            return env.ASSETS.fetch(new URL("/", request.url));
        }

        return response;
    },
};
