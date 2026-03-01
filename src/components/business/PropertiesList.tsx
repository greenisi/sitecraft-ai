'use client';

import React from 'react';

export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  status: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size: number;
  year_built: number;
  images: string[];
  features: string[];
}

interface PropertiesListProps {
  properties: Property[];
  accentColor?: string;
}

export default function PropertiesList({ properties, accentColor = '#3B82F6' }: PropertiesListProps) {
  return (
    <div className="w-full py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Property Image */}
            <div className="relative h-48 bg-gray-200">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              <div
                className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold text-white rounded"
                style={{ backgroundColor: accentColor }}
              >
                {property.status}
              </div>
            </div>

            {/* Property Details */}
            <div className="p-4">
              <p
                className="text-2xl font-bold mb-2"
                style={{ color: accentColor }}
              >
                ${property.price.toLocaleString()}
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                {property.title}
              </h3>

              {/* Beds/Baths/SqFt */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {property.bedrooms} beds
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  {property.bathrooms} baths
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {property.square_feet.toLocaleString()} sqft
                </span>
              </div>

              {/* Address */}
              <p className="text-sm text-gray-500">
                {property.address}, {property.city}, {property.state} {property.zip_code}
              </p>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No properties available at the moment.</p>
        </div>
      )}
    </div>
  );
}
