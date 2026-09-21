// Stable ids for saved progress: <topicId>-<slugified name>. Renaming a problem changes its id.

export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const problemId = (topicId, name) => `${topicId}-${slugify(name)}`;
