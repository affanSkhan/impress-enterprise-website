import { useState } from 'react';

/**
 * ProductImageGallery Component
 * Displays product images with options to set primary and delete
 */
export default function ProductImageGallery({ 
  images, 
  onSetPrimary, 
  onDelete, 
  loading = false 
}) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No images uploaded yet</p>
      </div>
    );
  }

  const handleSetPrimary = async (image) => {
    if (onSetPrimary) {
      await onSetPrimary(image);
    }
  };

  const handleDelete = async (image) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      if (onDelete) {
        await onDelete(image);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              image.is_primary
                ? 'border-primary-600 ring-2 ring-primary-600'
                : 'border-gray-200 hover:border-gray-300'
            } ${selectedImage?.id === image.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedImage(image)}
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100">
              <img
                src={image.image_url}
                alt="Product"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Primary Badge */}
            {image.is_primary && (
              <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                Primary
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {!image.is_primary && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPrimary(image);
                  }}
                  disabled={loading}
                  className="bg-white text-gray-800 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                  title="Set as primary image"
                >
                  Set Primary
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image);
                }}
                disabled={loading}
                className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                title="Delete image"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Info */}
      {selectedImage && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Selected Image</h4>
              <p className="text-sm text-gray-600 mt-1 break-all">
                {selectedImage.image_url}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>
                  Status: {selectedImage.is_primary ? 'Primary' : 'Secondary'}
                </span>
                <span>
                  Uploaded:{' '}
                  {new Date(selectedImage.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
        <span>
          {images.length} image{images.length !== 1 ? 's' : ''} total
        </span>
        <span>
          Primary:{' '}
          {images.find((img) => img.is_primary) ? (
            <span className="text-green-600 font-medium">Set</span>
          ) : (
            <span className="text-blue-600 font-medium">Not set</span>
          )}
        </span>
      </div>
    </div>
  );
}
