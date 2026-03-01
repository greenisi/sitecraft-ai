interface Service { id: string; name: string; description: string; price: number; duration: string; images: string[]; category: string; }

export default function ServicesList({ services, accentColor = '#9333ea' }: { services: Service[]; accentColor?: string }) {
    return (
          <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {services.map((service) => (
                        <div key={service.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                          {service.images?.[0] && (
                                          <img src={service.images[0]} alt={service.name} className="w-full h-48 object-cover" />
                                        )}
                                      <div className="p-6">
                                        {service.category && <span className="text-xs font-medium uppercase tracking-wide" style={{color: accentColor}}>{service.category}</span>}
                                                      <h3 className="text-xl font-bold mt-1 mb-2">{service.name}</h3>
                                                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                                                      <div className="flex items-center justify-between">
                                                                        <span className="text-2xl font-bold" style={{color: accentColor}}>${service.price}</span>
                                                        {service.duration && <span className="text-sm text-gray-500">{service.duration}</span>}
                                                      </div>
                                      </div>
                        </div>
                      ))}
                        </div>
                </div>
          </section>
        );
}
