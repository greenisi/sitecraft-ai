'use client';

import React, { useState } from 'react';
import type { Property } from './PropertiesList';

interface PropertyDetailProps {
  property: Property;
  accentColor?: string;
}

export default function PropertyDetail({ property, accentColor = '#3B82F6' }: PropertyDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Gallery Section */}
      <div className="relative">
        {/* Main Image */}
        <div className="h-96 bg-gray-200">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[selectedImageIndex]}
              alt={`${property.title} - Image ${selectedImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {property.images && property.images.length > 1 && (
          <div className="flex gap-2 p-4 bg-gray-100 overflow-x-auto">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index ? 'border-opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: selectedImageIndex === index ? accentColor : 'transparent' }}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div
          className="absolute top-4 right-4 px-3 py-1 text-sm font-semibold text-white rounded-full"
          style={{ backgroundColor: accentColor }}
        >
          {property.status}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6">
        {/* Price */}
        <p
          className="text-3xl font-bold mb-2"
          style={{ color: accentColor }}
        >
          ${property.price.toLocaleString()}
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{property.title}</h1>

        {/* Address */}
        <p className="text-gray-600 mb-6">
          {property.address}, {property.city}, {property.state} {property.zip_code}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-800">{property.bedrooms}</p>
            <p className="text-sm text-gray-600">Bedrooms</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-800">{property.bathrooms}</p>
            <p className="text-sm text-gray-600">Bathrooms</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-800">{property.square_feet.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Sq Ft</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-800">{property.year_built}</p>
            <p className="text-sm text-gray-600">Year Built</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Property Type</span>
            <span className="font-medium text-gray-800">{property.property_type}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Lot Size</span>
            <span className="font-medium text-gray-800">{property.lot_size.toLocaleString()} sqft</span>
          </div>
        </div>

        {/* Features List */}
        {property.features && property.features.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: accentColor }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
        </div>
      </div>
    </div>
  );
}
