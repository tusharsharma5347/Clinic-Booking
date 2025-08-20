import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startAt: '',
    endAt: ''
  });

  useEffect(() => {
    fetchBookings();
    fetchSlots();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/all-bookings');
      setBookings(response.data.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async () => {
    try {
      setGeneratingSlots(true);
      await api.post('/slots/generate', { days: 7 });
      toast.success('Slots generated successfully!');
      fetchSlots(); // Refresh slots
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to generate slots';
      toast.error(message);
    } finally {
      setGeneratingSlots(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      setAddingSlot(true);
      await api.post('/slots', newSlot);
      toast.success('Slot added successfully!');
      setNewSlot({ startAt: '', endAt: '' });
      fetchSlots(); // Refresh slots
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to add slot';
      toast.error(message);
    } finally {
      setAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to remove this slot?')) {
      return;
    }

    try {
      await api.delete(`/slots/${slotId}`);
      toast.success('Slot removed successfully!');
      fetchSlots(); // Refresh slots
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to remove slot';
      toast.error(message);
    }
  };

  const fetchSlots = async () => {
    try {
      // Use current date and next 30 days for better slot visibility
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];
      const toDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await api.get(`/slots/all?from=${fromDate}&to=${toDate}`);
      const slotsData = response.data.data.slots;
      
      // Group slots by date for display
      const groupedSlots = {};
      if (slotsData && typeof slotsData === 'object') {
        Object.entries(slotsData).forEach(([date, dateSlots]) => {
          if (Array.isArray(dateSlots)) {
            groupedSlots[date] = dateSlots;
          }
        });
      }
      
      setSlots(groupedSlots);
      console.log('Slots fetched successfully:', groupedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      console.error('Full error details:', error.response?.data);
      // Set empty slots to show "No slots found" message
      setSlots({});
    }
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all clinic bookings and appointments</p>
      </div>

      {/* Admin Actions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Admin Actions</h2>
          <button
            onClick={handleGenerateSlots}
            disabled={generatingSlots}
            className="btn-primary"
          >
            {generatingSlots ? 'Generating...' : 'Generate Slots (7 days)'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Generate available appointment slots for the next 7 days (weekdays only, 9 AM - 5 PM)
        </p>
        
        {/* Add Single Slot */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Add Single Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                value={newSlot.startAt}
                onChange={(e) => setNewSlot({ ...newSlot, startAt: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                value={newSlot.endAt}
                onChange={(e) => setNewSlot({ ...newSlot, endAt: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddSlot}
                disabled={addingSlot || !newSlot.startAt || !newSlot.endAt}
                className="btn-success w-full"
              >
                {addingSlot ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600">Confirmed Bookings</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">
            {bookings.filter(b => b.status === 'cancelled').length}
          </div>
          <div className="text-sm text-gray-600">Cancelled Bookings</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-success-600">
            {bookings.filter(b => b.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed Bookings</div>
        </div>
      </div>

      {/* All Bookings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Bookings</h2>
        
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No bookings found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booked On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(booking.slot.startAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(booking.slot.startAt)} - {formatTime(booking.slot.endAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.slot.durationMinutes} minutes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-success-100 text-success-800'
                          : booking.status === 'cancelled'
                          ? 'bg-danger-100 text-danger-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(booking.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Total Bookings: {bookings.length}
        </div>
      </div>


            {/* Slot Management */}
            <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Slot Management</h2>
        
        {Object.keys(slots).length === 0 ? (
          <p className="text-gray-500 text-center py-4">No slots found</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(slots).map(([date, dateSlots]) => (
              <div key={date} className="border-b border-gray-100 pb-3">
                <h3 className="font-medium text-gray-700 mb-2">
                  {formatDate(date)}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {dateSlots.map((slot) => (
                    <div key={slot.id} className={`flex justify-between items-center p-3 rounded-md border ${
                      slot.isBooked 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <span className="text-sm font-medium">
                        {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                        {slot.isBooked && (
                          <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-semibold">
                            Booked
                          </span>
                        )}
                        {!slot.isBooked && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                            Available
                          </span>
                        )}
                      </span>
                      {!slot.isBooked && (
                        <button
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="btn-danger text-xs px-3 py-1 hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
