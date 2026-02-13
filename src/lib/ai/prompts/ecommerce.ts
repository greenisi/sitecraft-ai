import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating an e-commerce site.
 * Includes product grid, product detail, cart, and checkout components.
 * All product data is static (no real backend).
 */
export function buildEcommercePrompt(config: GenerationConfig): string {
  const { business, branding, sections, ecommerce, aiPrompt } = config;

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

**Data Layer**

1. \`src/data/products.ts\` -- Static product array with TypeScript interface:
   \`Product { id, name, description, price, imageUrl, category, inStock, featured }\`.
   Include ${ecommerce?.products?.length ? ecommerce.products.length : '6-8'} products.

2. \`src/lib/cart-store.ts\` -- Zustand store for cart state (\`'use client'\`):
   - \`items: CartItem[]\` (product + quantity)
   - \`addItem\`, \`removeItem\`, \`updateQuantity\`, \`clearCart\`
   - \`totalItems\`, \`totalPrice\` computed getters
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

17. \`src/components/CheckoutForm.tsx\` -- ${
        checkoutType === 'multi-step'
          ? 'Multi-step checkout: shipping info, payment (placeholder), confirmation.'
          : 'Simple checkout form: name, email, shipping address, and a "Place Order" button.'
      } \`'use client'\`. On submit show a success message (no real payment).

18. \`src/app/checkout/page.tsx\` -- Checkout page with CheckoutForm and order summary sidebar.`
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
- All product data is static (no API calls). Products come from the data file.
- Price formatting: use \`Intl.NumberFormat\` with locale and currency "${currency}".
- Use realistic product names, descriptions, and placeholder images for "${business.industry}".
- The cart store must use Zustand; import from 'zustand' and 'zustand/middleware'.
- CRITICAL: Follow the DESIGN VARIETY instructions at the end of this prompt for hero, navbar, features layout, and testimonial style. Each website MUST look unique.
- Generate ALL files listed above in a single response
`;
}
