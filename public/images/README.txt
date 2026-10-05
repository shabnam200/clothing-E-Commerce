Demo images are now REMOTE (Unsplash) URLs stored in src/data/*.js (categories, products, v2, banners).
Replace any URL there with your database/API image URL; remote hosts must be listed in next.config.mjs (images.remotePatterns).
Run `npm run check:images` to verify every URL loads. Logo + hero-bg/footer-bg here are still local brand assets.
