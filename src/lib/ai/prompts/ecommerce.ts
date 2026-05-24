import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating an e-commerce site that uses
 * SiteCraft's real backend for products and checkout. The generated site:
 *   - Fetches products from {PLATFORM_API}/api/projects/{PROJECT_ID}/products
 *   - On checkout, POSTs the cart to {PLATFORM_API}/api/projects/{PROJECT_ID}/checkout
 *     and redirects the customer to the Stripe-hosted page
 *   - On success, shows a real "thank you" page (Stripe redirect target)
 *
 * Merchant funds flow through Stripe Connect to the merchant's own account —
 * SiteCraft is not in the money path.
 */
export function buildEcommercePrompt(config: GenerationConfig): string {
  const { business, branding, sections, ecommerce, aiPrompt } = config;
  // The route handler appends `projectId: "<uuid>"` to aiPrompt before calling
  // the pipeline. Extract it here so generated stores can call back to SiteCraft
  // with the right ID.
  const projectIdMatch = (aiPrompt || '').match(/projectId:\s*"([^"]+)"/);
  const PROJECT_ID = projectIdMatch?.[1] ?? '__PROJECT_ID__';
  const PLATFORM_API = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';

  const sectionList = sections
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      let line = `- ${s.type}${s.variant ? ` (variant: ${s.variant})` : ''}`;
      if (s.content) {
        const hints = Object.entries(s.content)
          .map(([k, v]) => `${k}="${v}"`)
          .join(', ');
        if (hints) line += ` | hints: ${hints}`;
      }
      if (s.items && s.items.length > 0) {
        const itemLines = s.items.map((item) => {
          const entries = Object.entries(item)
            .filter(([k]) => k !== '_type')
            .map(([k, v]) => `${k}: "${v}"`)
            .join(', ');
          return `    * ${entries}`;
        });
        line += `\n${itemLines.join('\n')}`;
      }
      return line;
    })
    .join('\n');

  const productsInfo = ecommerce?.products?.length
    ? ecommerce.products
        .map(
          (p) =>
            `  - "${p.name}" ($${p.price})${p.category ? ` [${p.category}]` : ''}: ${p.description}`
        )
        .join('\n')
    : '  (Generate 6-8 realistic sample products for the industry)';

  const currency = ecommerce?.currency ?? 'USD';
  const cartEnabled = ecommerce?.cartEnabled !== false;
  const checkoutType = ecommerce?.checkoutType ?? 'simple';

  return `Generate a complete, production-ready e-commerce website with static product data.

=== BUSINESS CONTEXT ===
Business name: "${business.name}"
${business.tagline ? `Tagline: "${business.tagline}"` : ''}
Description: "${business.description}"
Industry: "${business.industry}"
Target audience: "${business.targetAudience}"

=== VISUAL STYLE ===
Style: ${branding.style}
Primary color: ${branding.primaryColor}
Secondary color: ${branding.secondaryColor}
Accent color: ${branding.accentColor}
${branding.surfaceColor ? `Surface/background color: ${branding.surfaceColor}` : ''}

=== REQUESTED SECTIONS ===
${sectionList}

=== E-COMMERCE CONFIG ===
Currency: ${currency}
Cart: ${cartEnabled ? 'Enabled' : 'Disabled'}
Checkout: ${checkoutType}

Products:
${productsInfo}

=== FILES TO GENERATE ===

**Data Layer (uses SiteCraft backend — NOT a static array)**

1. \`src/lib/config.ts\` -- Exports \`PLATFORM_API\` and \`PROJECT_ID\` constants.
   \`\`\`ts
   export const PLATFORM_API = '${PLATFORM_API}';
   export const PROJECT_ID = '${PROJECT_ID}';
   \`\`\`

2. \`src/lib/products.ts\` -- Functions that fetch from the SiteCraft API:
   \`\`\`ts
   export type Product = {
     id: string; name: string; description: string | null;
     price: number; // dollars as number
     image_url: string | null; images: string[]; category: string | null;
     featured?: boolean;
   };
   export async function fetchProducts(): Promise<Product[]> {
     const res = await fetch(\`\${PLATFORM_API}/api/storefront/\${PROJECT_ID}/products\`, { next: { revalidate: 60 } });
     if (!res.ok) return [];
     const j = await res.json();
     return j.products ?? [];
   }
   export async function fetchProduct(id: string): Promise<Product | null> {
     const all = await fetchProducts();
     return all.find(p => p.id === id) ?? null;
   }
   \`\`\`
   No static product list. Products are managed by the merchant in SiteCraft.

3. \`src/lib/cart-store.ts\` -- Zustand store for cart state (\`'use client'\`):
   - \`items: { productId: string; quantity: number }[]\` (just IDs + qty — NEVER store prices client-side, server is source of truth)
   - \`addItem(productId)\`, \`removeItem(productId)\`, \`updateQuantity(productId, qty)\`, \`clearCart()\`
   - \`totalItems\` computed getter
   Use \`zustand\` with \`persist\` middleware for localStorage.

**Shared Components**

3. \`src/components/Navbar.tsx\` -- Fixed navigation bar (follow DESIGN VARIETY navbar style):
   - \`'use client'\` component with useState for mobile menu and cart count
   - Use the navbar style from DESIGN VARIETY instructions (glassmorphism, dark, transparent, solid, or colored)
   - Logo/brand name, links (Home, Shop, Cart), cart icon with animated item count badge
   - Mobile hamburger menu with Menu/X icons
   - \`aria-expanded\` and \`aria-label\` for accessibility

4. \`src/components/Footer.tsx\` -- Professional 4-column dark footer:
   - Dark themed: \`bg-gray-900 text-gray-300 pt-16 pb-8\`
   - Column 1: Brand, description, social icons
   - Column 2: Shop links (categories, featured, new arrivals)
   - Column 3: Customer Service (shipping, returns, FAQ, contact)
   - Column 4: Newsletter signup
   - Bottom bar: copyright + payment method badges
   - Responsive layout

**Home / Landing**

5. \`src/components/Hero.tsx\` -- Premium e-commerce hero (follow DESIGN VARIETY hero style):
   - Use the hero layout from DESIGN VARIETY instructions (gradient, split, dark, full-bleed image, etc.)
   - Strong headline with impactful typography
   - "Shop Now" CTA button with hover:scale-105 and glow effect
   - Trust badges or promo banner below hero

6. \`src/components/FeaturedProducts.tsx\` -- Horizontal scroll or grid of 3-4 featured
   products with "Add to Cart" buttons.

7. \`src/app/page.tsx\` -- Home page: Hero, FeaturedProducts, optional promo banner.

**Product Catalog**

8. \`src/components/ProductCard.tsx\` -- Card with image, name, price, and "Add to Cart"
   button. \`'use client'\` for add-to-cart interaction.

9. \`src/components/ProductGrid.tsx\` -- Responsive grid of ProductCards. Accepts a
   products array and optional category filter.

10. \`src/components/CategoryFilter.tsx\` -- Horizontal filter bar to select product
    categories. \`'use client'\` for active filter state.

11. \`src/app/shop/page.tsx\` -- Shop page with CategoryFilter and ProductGrid.

**Product Detail**

12. \`src/components/ProductDetail.tsx\` -- Full product view: large image, name,
    description, price, quantity selector, "Add to Cart" button. \`'use client'\`.

13. \`src/app/shop/[productId]/page.tsx\` -- Dynamic product page that looks up the
    product by id from the static data.

**Cart & Checkout**

${
  cartEnabled
    ? `14. \`src/components/CartDrawer.tsx\` -- Slide-over cart panel (or full page) showing
    cart items, quantities, subtotal, and checkout button. \`'use client'\`.

15. \`src/components/CartItem.tsx\` -- Single cart line item with image thumbnail,
    name, price, quantity controls, and remove button. \`'use client'\`.

16. \`src/app/cart/page.tsx\` -- Full cart page with CartItem list and order summary.

17. \`src/components/CheckoutButton.tsx\` (\`'use client'\`) -- "Proceed to Checkout"
    button. On click:
    \`\`\`ts
    const items = useCart(s => s.items);
    async function checkout() {
      const res = await fetch(\`\${PLATFORM_API}/api/storefront/\${PROJECT_ID}/checkout\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, qty: i.quantity })),
          successUrl: window.location.origin + '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/cart',
        }),
      });
      const j = await res.json();
      if (j.url) window.location.href = j.url; else alert(j.error || 'Checkout failed');
    }
    \`\`\`
    DO NOT generate a custom card-input form. Stripe handles payment on
    Stripe's hosted page — that's the entire point of this architecture.

18. \`src/app/checkout/success/page.tsx\` -- "Thank you" page rendered when the
    customer returns from Stripe's hosted checkout. Reads \`?session_id=\` from
    the URL, shows a confirmation message + their order summary text. Triggers
    \`useCart().clearCart()\` once on mount so the cart resets.`
    : `14. (Cart disabled -- skip cart and checkout files)`
}

**Layout**

${cartEnabled ? '19' : '15'}. \`src/app/layout.tsx\` -- Root layout with Navbar, Footer, font imports, global CSS.

${cartEnabled ? '20' : '16'}. \`src/app/globals.css\` -- Tailwind directives and global styles.

${config.navigation ? `=== NAVIGATION CONFIG ===
${config.navigation.navbarStyle ? `Navbar style: ${config.navigation.navbarStyle}` : ''}
${config.navigation.navbarPosition ? `Navbar position: ${config.navigation.navbarPosition}` : ''}
${config.navigation.footerStyle ? `Footer style: ${config.navigation.footerStyle}` : ''}
${config.navigation.socialLinks?.length ? `Social links: ${config.navigation.socialLinks.map((l) => `${l.platform}: ${l.url}`).join(', ')}` : ''}
` : ''}
${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- Every section MUST have scroll-triggered fade-in animations using IntersectionObserver
- All buttons MUST have hover:scale-105 and transition effects
- Product cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- The hero style should follow the DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
- The navbar style should follow the DESIGN VARIETY instructions (glassmorphism, dark, transparent, etc.)
- Footer MUST be 4-column dark themed with newsletter signup
- Mobile hamburger menu MUST work with useState toggle
- Add \`pt-16\` to page content for fixed navbar
- **Product data comes from the SiteCraft API** (\`fetchProducts()\` from \`@/lib/products\`).
  NEVER hardcode a product array. Pages that show products MUST be async server
  components calling \`fetchProducts()\` server-side, or use \`useEffect\` + \`useState\`
  on client components.
- **Checkout uses the platform API** (\`POST /api/storefront/\${PROJECT_ID}/checkout\`).
  Customer is redirected to Stripe-hosted checkout. NEVER render your own card form.
- Price formatting: use \`Intl.NumberFormat\` with locale and currency "${currency}".
  Product prices come back as dollars (number), e.g. 29.99 — pass directly to formatter.
- The cart store must use Zustand; import from 'zustand' and 'zustand/middleware'.
- The cart store stores ONLY { productId, quantity } — never store prices client-side.
  Always look up the current price from the latest \`fetchProducts()\` call when rendering.
- CRITICAL: Follow the DESIGN VARIETY instructions at the end of this prompt for hero, navbar, features layout, and testimonial style. Each website MUST look unique.
- Generate ALL files listed above in a single response
`;
}
