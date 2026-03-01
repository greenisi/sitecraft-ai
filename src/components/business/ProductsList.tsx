interface Product { id: string; name: string; description: string; price: number; compare_at_price: number | null; images: string[]; category: string; inventory_count: number; }

export default function ProductsList({ products, onAddToCart, accentColor = '#9333ea' }: { products: Product[]; onAddToCart?: (productId: string) => void; accentColor?: string }) {
    return (
          <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Our Products</h2>h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                                      <div className="relative aspect-square bg-gray-100">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>div>
                                                      )}
                                        {product.compare_at_price && product.compare_at_price > product.price && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Sale</span>span>
                                                      )}
                                      </div>div>
                                      <div className="p-4">
                                        {product.category && <span className="text-xs text-gray-500 uppercase">{product.category}</span>span>}
                                                      <h3 className="font-semibold mt-1 mb-2 line-clamp-2">{product.name}</h3>h3>
                                                      <div className="flex items-center gap-2 mb-3">
                                                                        <span className="text-lg font-bold" style={{color: accentColor}}>${product.price.toFixed(2)}</span>span>
                                                        {product.compare_at_price && (
                                              <span className="text-sm text-gray-400 line-through">${product.compare_at_price.toFixed(2)}</span>span>
                                                                        )}
                                                      </div>div>
                                        {onAddToCart && product.inventory_count > 0 && (
                                            <button onClick={() => onAddToCart(product.id)} className="w-full py-2 rounded-lg text-white font-medium hover:opacity-90" style={{backgroundColor: accentColor}}>
                                                                Add to Cart
                                            </button>button>
                                                      )}
                                        {product.inventory_count === 0 && <span className="text-sm text-red-500">Out of Stock</span>span>}
                                      </div>div>
                        </div>div>
                      ))}
                        </div>div>
                </div>div>
          </section>section>
        );
}</section>
