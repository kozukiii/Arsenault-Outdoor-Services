// Pulls Google reviews for Arsenault Outdoor Services via the Places API (New),
// keeps only 5-star reviews, and writes reviews.json for the site to render.
//
// Run locally:   GOOGLE_PLACES_KEY=your_key node fetch-reviews.mjs
// In CI:         the key comes from the GOOGLE_PLACES_KEY GitHub Actions secret.
// The API key is NEVER committed — it only ever lives in an env var / secret.

import { writeFileSync } from 'node:fs';

const PLACE_ID = 'ChIJ0ZYnHtat_ocRgGiYqiiOXRc'; // Arsenault Outdoor Services (not secret)
const MIN_STARS = 5;
const KEY = process.env.GOOGLE_PLACES_KEY;

if (!KEY) {
  console.error('Missing GOOGLE_PLACES_KEY environment variable.');
  process.exit(1);
}

const fieldMask = [
  'displayName',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews.rating',
  'reviews.text',
  'reviews.authorAttribution',
  'reviews.relativePublishTimeDescription',
  'reviews.publishTime',
].join(',');

const res = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
  headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': fieldMask },
});

if (!res.ok) {
  console.error(`Places API error ${res.status}:`, await res.text());
  process.exit(1);
}

const data = await res.json();

const reviews = (data.reviews || [])
  .filter((r) => (r.rating || 0) >= MIN_STARS)
  .map((r) => ({
    author: r.authorAttribution?.displayName || 'Google user',
    photo: r.authorAttribution?.photoUri || '',
    profileUri: r.authorAttribution?.uri || '',
    rating: r.rating,
    relativeTime: r.relativePublishTimeDescription || '',
    publishTime: r.publishTime || '',
    text: (r.text?.text || '').trim(),
  }))
  .filter((r) => r.text.length > 0);

const out = {
  rating: data.rating ?? null,
  userRatingCount: data.userRatingCount ?? 0,
  mapsUri: data.googleMapsUri || 'https://share.google/ENAZP9v3o4xRCkjQK',
  updated: new Date().toISOString(),
  reviews,
};

writeFileSync(new URL('./reviews.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(
  `Wrote reviews.json — ${reviews.length} five-star review(s); overall ${out.rating}★ from ${out.userRatingCount} ratings.`
);
