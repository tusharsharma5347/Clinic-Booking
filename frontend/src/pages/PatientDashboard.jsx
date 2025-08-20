import React, { useState, useEffect } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const PatientDashboard = () => {
  const [slots, setSlots] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get available slots for the next 7 days
      const fromDate = format(selectedDate, 'yyyy-MM-dd');
      const toDate = format(addDays(selectedDate, 6), 'yyyy-MM-dd');
      
      const [slotsResponse, bookingsResponse] = await Promise.all([
        api.get(`/slots?from=${fromDate}&to=${toDate}&includeBooked=true`),
        api.get('/my-bookings')
      ]);

      // Process slots to show both available and booked ones
      const slotsData = slotsResponse.data.data.slots;
      const processedSlots = {};
      
      Object.entries(slotsData).forEach(([date, dateSlots]) => {
        processedSlots[date] = dateSlots.map(slot => ({
          ...slot,
          isBooked: slot.isBooked || false
        }));
      });

      setSlots(processedSlots);
      setBookings(bookingsResponse.data.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      setBookingLoading(true);
      await api.post('/book', { slotId });
      toast.success('Slot booked successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to book slot';
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to cancel booking';
      toast.error(message);
    }
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600 mt-2">Book appointments and manage your bookings</p>
      </div>

      {/* Date Navigation */}
      <div className="flex justify-center space-x-2">
        {[...Array(7)].map((_, index) => {
          const date = addDays(selectedDate, index);
          const dateKey = format(date, 'yyyy-MM-dd');
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {format(date, 'EEE dd')}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* All Slots */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Slots</h2>
          <p className="text-sm text-gray-600 mb-4">
            <span className="inline-block w-3 h-3 bg-success-200 rounded-full mr-2"></span>
            Available slots can be booked
            <span className="inline-block w-3 h-3 bg-red-200 rounded-full ml-4 mr-2"></span>
            Booked slots are unavailable
          </p>
          <div className="space-y-3">
            {Object.entries(slots).map(([date, dateSlots]) => (
              <div key={date} className="border-b border-gray-100 pb-3">
                <h3 className="font-medium text-gray-700 mb-2">
                  {formatDate(date)}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {dateSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => !slot.isBooked && handleBookSlot(slot.id)}
                      disabled={bookingLoading || slot.isBooked}
                      className={`px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        slot.isBooked 
                          ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed'
                          : 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100'
                      }`}
                    >
                      {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                      {slot.isBooked && <span className="ml-1 text-xs text-red-600 font-medium">(Booked)</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(slots).length === 0 && (
              <p className="text-gray-500 text-center py-4">No available slots for the selected dates</p>
            )}
          </div>
        </div>

        {/* My Bookings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Bookings</h2>
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No bookings yet</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(booking.slot.startAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(booking.slot.startAt)} - {formatTime(booking.slot.endAt)}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-success-100 text-success-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    {booking.status === 'confirmed' && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn-danger text-xs px-3 py-2 hover:bg-danger-700 transition-colors"
                        >
                          Cancel Booking
                        </button>
                        <span className="text-xs text-gray-500 text-center">
                          Click to cancel
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
