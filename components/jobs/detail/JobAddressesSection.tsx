/**
 * Job Addresses Section Component
 * Manages addresses for Job entities with full CRUD operations
 */

'use client';

import { useState } from 'react';
import {
  GoogleMapsAddressModal,
  type Address,
} from '../../shared/google-maps-address';
import {
  useAddressesBySource,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../../hooks/useAddressApi';
import { toast } from 'sonner';

interface JobAddressesSectionProps {
  jobId: string;
}

export function JobAddressesSection({ jobId }: JobAddressesSectionProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Address API hooks
  const { data: addresses = [], isLoading: addressesLoading } = useAddressesBySource(jobId, 'JOB');
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  // Address handlers
  const handleAddressSave = async (addressData: Omit<Address, 'id' | 'createdAt'>) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          input: {
            sourceId: jobId,
            sourceType: 'JOB',
            addressTypes: addressData.addressTypes || [addressData.addressType],
            line1: addressData.line1,
            line2: addressData.line2,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
            notes: addressData.notes,
            isPrimary: addressData.isPrimary,
          },
        });
        toast.success('Address updated successfully');
        setEditingAddress(null);
      } else {
        // Create new address
        await createAddressMutation.mutateAsync({
          sourceId: jobId,
          sourceType: 'JOB',
          addressTypes: addressData.addressTypes || [addressData.addressType],
          line1: addressData.line1,
          line2: addressData.line2,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country,
          notes: addressData.notes,
          isPrimary: addressData.isPrimary,
        });
        toast.success('Address added successfully');
      }
    } catch (err) {
      toast.error(editingAddress ? 'Failed to update address' : 'Failed to add address');
      throw err;
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleAddressModalClose = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleAddressDelete = async (address: Address) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await deleteAddressMutation.mutateAsync({
        id: address.id,
        sourceId: jobId,
        sourceType: 'JOB',
      });
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div id="section-addresses" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Addresses
        </h2>
        <button
          onClick={() => setIsAddressModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Address
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {addressesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Add billing, shipping, or mailing addresses for this job using Google Maps search.
            </p>
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add First Address
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="relative flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
              >
                {/* Address Type Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  address.addressType === 'BILLING' ? 'bg-blue-100' :
                  address.addressType === 'SHIPPING' ? 'bg-green-100' :
                  address.addressType === 'MAILING' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  {address.addressType === 'BILLING' && (
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  {address.addressType === 'SHIPPING' && (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12l-4 9H8l-4-9h4m0 0V4m0 3v10m4-10v10m-4 0h4" />
                    </svg>
                  )}
                  {address.addressType === 'MAILING' && (
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {address.addressType === 'OTHER' && (
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>

                {/* Address Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      address.addressType === 'BILLING' ? 'bg-blue-100 text-blue-700' :
                      address.addressType === 'SHIPPING' ? 'bg-green-100 text-green-700' :
                      address.addressType === 'MAILING' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {address.addressType.charAt(0) + address.addressType.slice(1).toLowerCase()}
                    </span>
                    {address.isPrimary && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{address.line1}</p>
                  {address.line2 && <p className="text-sm text-gray-600">{address.line2}</p>}
                  <p className="text-sm text-gray-600">
                    {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-sm text-gray-500">{address.country}</p>
                  {address.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{address.notes}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit address"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleAddressDelete(address)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete address"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Maps Address Modal */}
      <GoogleMapsAddressModal
        isOpen={isAddressModalOpen}
        onClose={handleAddressModalClose}
        onSave={handleAddressSave}
        initialAddress={editingAddress || undefined}
      />
    </div>
  );
}
