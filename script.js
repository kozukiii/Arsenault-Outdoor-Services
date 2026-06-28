// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('hidden') === false;
  mobileMenu.classList.toggle('flex', open);
  menuBtn.setAttribute('aria-expanded', open);
});

// Close mobile menu after tapping a link
mobileMenu.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('flex');
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);

// Current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Scroll-reveal animations
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Reviews — render the hand-entered testimonials together with the live Google
// reviews (reviews.json, refreshed daily by a GitHub Action). The combined list
// is sorted newest-first and capped at MAX_REVIEWS, so as new Google reviews come
// in they push out the oldest cards (the seed testimonials go first).
//
// The seed testimonials below carry old `date` values so they naturally rotate
// out once enough fresh Google reviews exist. If reviews.json fails to load, the
// fallback cards already in the HTML stay put.
const MAX_REVIEWS = 6;
const SEED_REVIEWS = [
  {
    author: 'Natalie Rose Doerfler',
    rating: 5,
    text:
      "I highly recommend Matt Arsenault for all your lawn care and landscaping needs. " +
      "His attention to detail, professionalism, and quality workmanship completely transformed our yard. " +
      "The results speak for themselves—beautiful, healthy grass and outstanding curb appeal. " +
      "If you're looking for someone who takes pride in their work and delivers exceptional results, Matt is the person to call.",
    source: 'manual',
    date: '2025-06-01T00:00:00Z',
  },
  {
    author: 'Monica Thomas',
    rating: 5,
    text:
      "A big shout out to a young guy who has his own business and has done a great job at a very reasonable price. " +
      "He has done all different jobs and my lawn looks great!",
    source: 'manual',
    date: '2025-05-01T00:00:00Z',
  },
];

(async function loadReviews() {
  const grid = document.getElementById('reviewsGrid');
  const badge = document.getElementById('reviewsBadge');
  if (!grid) return;

  const star =
    '<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z"/></svg>';
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const initials = (name) =>
    name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  let data = null;
  try {
    const res = await fetch('reviews.json', { cache: 'no-cache' });
    if (res.ok) data = await res.json();
  } catch {
    /* fall through — seed reviews still render */
  }

  // Rating badge (e.g. "5.0  ★★★★★  ·  4 Google reviews")
  if (badge && data && data.rating) {
    badge.innerHTML =
      '<a href="' + esc(data.mapsUri || '#') + '" target="_blank" rel="noopener" ' +
      'class="inline-flex items-center gap-3 bg-white rounded-full pl-4 pr-5 py-2.5 shadow-sm ring-1 ring-moss-900/10 hover:-translate-y-0.5 transition">' +
      '<svg viewBox="0 0 24 24" class="w-5 h-5"><path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.56c2.08-1.92 3.28-4.74 3.28-7.84Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.67 2.84C6.72 7.3 9.14 5.38 12 5.38Z"/></svg>' +
      '<span class="font-bold text-moss-800 text-lg">' + Number(data.rating).toFixed(1) + '</span>' +
      '<span class="flex gap-0.5 text-moss-500">' + star.repeat(5) + '</span>' +
      '<span class="text-sm text-moss-700/70">' + (data.userRatingCount || 0) + ' Google reviews</span>' +
      '</a>';
    badge.classList.remove('hidden');
    badge.classList.add('flex');
  }

  // Normalize Google reviews to the same shape as the seed reviews
  const google = (data && Array.isArray(data.reviews) ? data.reviews : [])
    .filter((r) => r.text)
    .map((r) => ({
      author: r.author,
      rating: r.rating,
      text: r.text,
      photo: r.photo,
      relativeTime: r.relativeTime,
      source: 'google',
      date: r.publishTime || '',
    }));

  // Merge, newest-first, cap at MAX_REVIEWS (oldest fall off — seeds first)
  const all = [...google, ...SEED_REVIEWS]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, MAX_REVIEWS);

  if (!all.length) return; // keep HTML fallback

  const cols = Math.min(all.length, 3);
  grid.className = 'grid sm:grid-cols-2 lg:grid-cols-' + cols + ' gap-6';

  grid.innerHTML = all
    .map((r) => {
      const avatar = r.photo
        ? '<img src="' + esc(r.photo) + '" alt="' + esc(r.author) + '" referrerpolicy="no-referrer" ' +
          'class="w-11 h-11 rounded-full object-cover" ' +
          "onerror=\"this.outerHTML='<span class=\\'display w-11 h-11 rounded-full bg-moss-100 text-moss-700 font-semibold flex items-center justify-center\\'>" +
          esc(initials(r.author)) + "</span>'\">"
        : '<span class="display w-11 h-11 rounded-full bg-moss-100 text-moss-700 font-semibold flex items-center justify-center">' +
          esc(initials(r.author)) + '</span>';
      const meta =
        r.source === 'google'
          ? 'Google' + (r.relativeTime ? ' · ' + esc(r.relativeTime) : '')
          : 'Verified customer';
      return (
        '<figure class="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-moss-900/5 flex flex-col">' +
        '<div class="flex gap-1 text-moss-500 mb-4" aria-label="5 out of 5 stars">' + star.repeat(5) + '</div>' +
        '<blockquote class="text-moss-700/90 text-lg leading-relaxed grow">"' + esc(r.text) + '"</blockquote>' +
        '<figcaption class="mt-6 flex items-center gap-3">' + avatar +
        '<span class="leading-tight"><span class="block font-semibold text-moss-800">' + esc(r.author) + '</span>' +
        '<span class="text-sm text-moss-700/60">' + meta + '</span></span>' +
        '</figcaption></figure>'
      );
    })
    .join('');
})();

// Hero background slideshow — starts immediately on load (no scroll/interaction
// gate), then crossfades through the slides every 5 seconds.
const slides = document.querySelectorAll('#heroSlides .hero-slide');
if (slides.length > 1) {
  let current = 0;
  const advance = () => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  };
  setInterval(advance, 3200);
}

