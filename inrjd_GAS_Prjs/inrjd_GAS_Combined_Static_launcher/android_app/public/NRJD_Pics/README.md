# NRJD Slideshow Images

Place the Jagannath/NRJD slideshow images for the Japa session and counter pages in this folder. Supported formats are `.jpg`, `.jpeg`, `.png`, and `.webp`.

After adding or removing images, run `npm run gen` from `android_app`. The generator updates `public/image-list.json`; run `npx cap sync android` before rebuilding the Android app. Keep file sizes reasonable for faster mobile loading.
