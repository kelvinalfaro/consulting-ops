export default {
  id: 'example-provider',
  async fetch(source, context) {
    const response = await context.fetch(source.url);
    return context.parseJsonFeed(await response.json(), source);
  },
};
