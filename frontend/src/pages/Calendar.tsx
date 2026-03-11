import React, { useState } from 'react';

// Reservation interface
interface Reservation {
  id: number;
  date: Date;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  reservationType: 'table' | 'party' | 'event' | 'meeting';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  status: 'available' | 'reserved' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: 1,
      date: new Date(2025, 0, 10, 18, 0), // Jan 10, 2025, 6:00 PM
      timeSlot: 'evening',
      reservationType: 'table',
      customerName: 'Juan dela Cruz',
      customerPhone: '+63 917 123 4567',
      customerEmail: 'juan@example.com',
      partySize: 4,
      status: 'confirmed',
      notes: 'Birthday celebration',
      createdAt: new Date()
    },
    {
      id: 2,
      date: new Date(2025, 0, 10, 13, 30), // Jan 10, 2025, 1:30 PM
      timeSlot: 'afternoon',
      reservationType: 'party',
      customerName: 'Maria Santos',
      customerPhone: '+63 918 987 6543',
      partySize: 15,
      status: 'reserved',
      notes: 'Product demo meeting',
      createdAt: new Date()
    }
  ]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(reservations[1]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [reservationForm, setReservationForm] = useState({
    reservationType: 'table' as Reservation['reservationType'],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 1,
    time: '12:00',
    notes: ''
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(r => 
      r.date.getDate() === date.getDate() &&
      r.date.getMonth() === date.getMonth() &&
      r.date.getFullYear() === date.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const handleGridClick = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setReservationForm({
      reservationType: 'table',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      partySize: 1,
      time: timeStr,
      notes: ''
    });
    setEditingReservation(null);
    setIsReservationModalOpen(true);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'prev' ? -1 : 1));
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentDate(today);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleDeleteReservation = (reservationId: number) => {
    setReservations(reservations.filter(reservation => reservation.id !== reservationId));
    setIsReservationModalOpen(false);
    setEditingReservation(null);
  };

  const handleUpdateReservation = () => {
    if (!editingReservation || !reservationForm.customerName.trim() || reservationForm.customerPhone.length !== 11) {
      if (reservationForm.customerPhone.length !== 11) {
        alert('Phone number must be exactly 11 digits (e.g., 09123456789)');
      }
      return;
    }

    const [h, m] = reservationForm.time.split(':').map(Number);
    const updatedDate = new Date(editingReservation.date);
    updatedDate.setHours(h, m);

    setReservations(reservations.map(reservation => 
      reservation.id === editingReservation.id 
        ? { 
            ...reservation,
            date: updatedDate,
            reservationType: reservationForm.reservationType,
            customerName: reservationForm.customerName,
            customerPhone: reservationForm.customerPhone,
            customerEmail: reservationForm.customerEmail,
            partySize: reservationForm.partySize,
            notes: reservationForm.notes
          }
        : reservation
    ));
    setIsReservationModalOpen(false);
    setEditingReservation(null);
  };

  const handleCreateReservation = () => {
    if (!selectedDate || !reservationForm.customerName.trim() || reservationForm.customerPhone.length !== 11) {
      if (reservationForm.customerPhone.length !== 11) {
        alert('Phone number must be exactly 11 digits (e.g., 09123456789)');
      }
      return;
    }

    const [h, m] = reservationForm.time.split(':').map(Number);
    const reservationDate = new Date(selectedDate);
    reservationDate.setHours(h, m);

    const newReservation: Reservation = {
      id: Math.max(...reservations.map(r => r.id), 0) + 1,
      date: reservationDate,
      timeSlot: h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening',
      reservationType: reservationForm.reservationType,
      customerName: reservationForm.customerName,
      customerPhone: reservationForm.customerPhone,
      customerEmail: reservationForm.customerEmail,
      partySize: reservationForm.partySize,
      status: 'reserved',
      notes: reservationForm.notes,
      createdAt: new Date()
    };

    setReservations([...reservations, newReservation]);
    setIsReservationModalOpen(false);
    setReservationForm({
      reservationType: 'table',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      partySize: 1,
      time: '12:00',
      notes: ''
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    if (value.length <= 11) {
      setReservationForm(f => ({ ...f, customerPhone: value }));
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  return (
    <div className="flex h-screen bg-[#f8f6ff] overflow-hidden text-[#3b2063]">
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-[#3b2063]/5 shadow-sm">
          {/* ... (Header content remains same until navigation buttons) ... */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center bg-[#f8f6ff] rounded-2xl p-3 min-w-15 border border-[#3b2063]/10 shadow-inner">
              <span className="text-[10px] uppercase font-black text-[#3b2063]/40 leading-none mb-1 tracking-widest">
                {selectedDate.toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-2xl font-black text-[#3b2063] leading-none">
                {selectedDate.getDate()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-[#3b2063]">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h1>
              <p className="text-sm font-bold text-[#3b2063]/60 uppercase tracking-widest">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 hover:bg-[#f8f6ff] rounded-full text-[#3b2063]/40 hover:text-[#3b2063] transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="flex items-center bg-[#f8f6ff] rounded-2xl p-1.5 border border-[#3b2063]/10">
              <button onClick={() => navigateDay('prev')} className="p-2 hover:bg-white hover:shadow-md rounded-xl text-[#3b2063] transition-all active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={goToToday} className="px-6 py-2 text-sm font-black uppercase tracking-widest text-[#3b2063] hover:bg-white hover:shadow-md rounded-xl transition-all active:scale-95">
                Today
              </button>
              <button onClick={() => navigateDay('next')} className="p-2 hover:bg-white hover:shadow-md rounded-xl text-[#3b2063] transition-all active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <select 
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'day' | 'week' | 'month')}
              className="bg-[#f8f6ff] border border-[#3b2063]/10 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest text-[#3b2063] focus:outline-none focus:ring-4 focus:ring-[#3b2063]/5 cursor-pointer shadow-sm hover:shadow-md transition-all appearance-none"
            >
              <option value="day">Day view</option>
              <option value="week">Week view</option>
              <option value="month">Month view</option>
            </select>
            <button 
              onClick={() => {
                setEditingReservation(null);
                setReservationForm({
                  reservationType: 'table',
                  customerName: '',
                  customerPhone: '',
                  customerEmail: '',
                  partySize: 1,
                  time: '12:00',
                  notes: ''
                });
                setIsReservationModalOpen(true);
              }}
              className="bg-[#fbbf24] text-[#3b2063] px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#e6a600] transition-all shadow-lg hover:shadow-xl active:scale-95 border-b-4 border-[#e6a600]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Event
            </button>
          </div>
        </header>

        {/* Time Grid View */}
        <div className="flex-1 overflow-y-auto relative bg-white m-4 rounded-[2.5rem] shadow-xl border border-[#3b2063]/5">
          <div className="min-h-full">
            {hours.map((hour) => (
              <div key={hour} className="flex border-b border-[#f8f6ff] group min-h-30">
                <div className="w-24 py-6 px-4 text-right text-[10px] font-black text-[#3b2063]/40 uppercase tracking-widest select-none">
                  {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                </div>
                <div 
                  className="flex-1 border-l border-[#f8f6ff] relative group-hover:bg-[#f8f6ff]/30 transition-colors cursor-pointer"
                  onClick={() => handleGridClick(hour)}
                >
                  {/* Render Reservations for this hour */}
                  {getReservationsForDate(selectedDate)
                    .filter(r => r.date.getHours() === hour)
                    .map(reservation => (
                      <div
                        key={reservation.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                        }}
                        className={`absolute left-4 right-6 top-3 rounded-3xl border-l-[6px] p-5 shadow-lg cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${
                          reservation.id === selectedReservation?.id ? 'ring-4 ring-[#3b2063]/10 scale-[1.02]' : ''
                        } ${
                          reservation.reservationType === 'party' 
                            ? 'bg-blue-50 border-blue-500 text-blue-900' 
                            : 'bg-[#fff9e6] border-[#fbbf24] text-[#3b2063]'
                        }`}
                        style={{ height: '94px' }}
                      >
                        <h4 className="text-base font-black uppercase tracking-tight mb-1">{reservation.customerName}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 bg-white/50 px-2 py-1 rounded-lg">
                            {formatTime(reservation.date)}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 bg-white/50 px-2 py-1 rounded-lg">
                            {reservation.partySize} Guests
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Area */}
      <aside className="w-95 flex flex-col bg-white border-l border-[#3b2063]/5 shadow-2xl">
        {/* Mini Calendar */}
        <div className="p-8 border-b border-[#f8f6ff]">
          <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-[#f8f6ff] rounded-xl text-[#3b2063] transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#3b2063]">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-[#f8f6ff] rounded-xl text-[#3b2063] transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[9px] font-black text-[#3b2063]/30 text-center uppercase tracking-widest mb-3">
                {day}
              </div>
            ))}
            {/* Empty cells for first day of month */}
            {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
              <div key={`empty-${i}`} className="w-10 h-10" />
            ))}
            {/* Days of month */}
            {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map(day => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const isSelected = 
                date.getDate() === selectedDate.getDate() && 
                date.getMonth() === selectedDate.getMonth() && 
                date.getFullYear() === selectedDate.getFullYear();
              const today = new Date();
              const isToday = 
                date.getDate() === today.getDate() && 
                date.getMonth() === today.getMonth() && 
                date.getFullYear() === today.getFullYear();
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(date)}
                  className={`w-10 h-10 mx-auto flex items-center justify-center text-[11px] font-black rounded-2xl transition-all shadow-sm ${
                    isSelected 
                      ? 'bg-[#3b2063] text-white shadow-lg shadow-[#3b2063]/20 scale-110' 
                      : isToday 
                        ? 'bg-[#fbbf24] text-[#3b2063] shadow-md'
                        : 'hover:bg-[#f8f6ff] text-[#3b2063]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reservation Details */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {selectedReservation ? (
            <>
              <div className="flex items-center justify-between">
                <div className="bg-[#f8f6ff] px-4 py-1.5 rounded-full border border-[#3b2063]/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#3b2063]/60">
                    ID #{selectedReservation.id.toString().padStart(4, '0')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingReservation(selectedReservation);
                      setReservationForm({
                        reservationType: selectedReservation.reservationType,
                        customerName: selectedReservation.customerName,
                        customerPhone: selectedReservation.customerPhone,
                        customerEmail: selectedReservation.customerEmail || '',
                        partySize: selectedReservation.partySize,
                        time: `${selectedReservation.date.getHours().toString().padStart(2, '0')}:${selectedReservation.date.getMinutes().toString().padStart(2, '0')}`,
                        notes: selectedReservation.notes || ''
                      });
                      setIsReservationModalOpen(true);
                    }}
                    className="p-3 bg-[#f8f6ff] hover:bg-[#3b2063] hover:text-white rounded-2xl text-[#3b2063] transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this reservation?')) {
                        handleDeleteReservation(selectedReservation.id);
                      }
                    }}
                    className="p-3 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl text-red-500 transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2.032 2.032 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#3b2063] mb-2 leading-tight">
                  {selectedReservation.customerName}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#fbbf24] text-[#3b2063] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                    {selectedReservation.reservationType}
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                    {selectedReservation.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-[#f8f6ff] p-4 rounded-3xl border border-[#3b2063]/5">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#3b2063]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 leading-none mb-1">Date</p>
                    <p className="text-sm font-black text-[#3b2063]">
                      {selectedReservation.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#f8f6ff] p-4 rounded-3xl border border-[#3b2063]/5">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#3b2063]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 leading-none mb-1">Time</p>
                    <p className="text-sm font-black text-[#3b2063]">
                      {formatTime(selectedReservation.date)} - {new Date(selectedReservation.date.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#f8f6ff] p-4 rounded-3xl border border-[#3b2063]/5">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#3b2063]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 leading-none mb-1">Contact</p>
                    <p className="text-sm font-black text-[#3b2063]">{selectedReservation.customerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-[#f8f6ff]">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3b2063]/40 mb-4">Reservation Notes</h4>
                <div className="bg-[#f8f6ff] p-6 rounded-4xl border border-[#3b2063]/5 italic text-sm text-[#3b2063]/70 leading-relaxed shadow-inner">
                  "{selectedReservation.notes || 'No special requests provided for this booking.'}"
                </div>
              </div>

              <div className="pt-8 border-t border-[#f8f6ff]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3b2063]/40">Guest List</h4>
                  <span className="text-xs font-black text-[#3b2063] bg-[#fbbf24] px-3 py-1 rounded-full">{selectedReservation.partySize} Total</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white bg-[#f8f6ff] overflow-hidden shadow-md">
                        <img src={`https://i.pravatar.cc/100?u=${i + selectedReservation.id}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {selectedReservation.partySize > 4 && (
                      <div className="w-12 h-12 rounded-2xl border-4 border-white bg-[#fbbf24] flex items-center justify-center text-[11px] font-black text-[#3b2063] shadow-md">
                        +{selectedReservation.partySize - 4}
                      </div>
                    )}
                  </div>
                  <button className="w-12 h-12 rounded-2xl border-2 border-dashed border-[#3b2063]/20 flex items-center justify-center text-[#3b2063]/40 hover:bg-[#f8f6ff] hover:text-[#3b2063] transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-24 h-24 bg-[#f8f6ff] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <svg className="w-10 h-10 text-[#3b2063]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-[#3b2063] mb-2">No Selection</h3>
              <p className="text-sm font-bold text-[#3b2063]/40 uppercase tracking-widest leading-relaxed">
                Select a reservation from the schedule to view details
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Reservation Modal */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#3b2063]/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-[#3b2063] uppercase tracking-tight leading-none">
                {editingReservation ? 'Edit Booking' : 'Create Booking'}
              </h2>
              <button
                onClick={() => {
                  setIsReservationModalOpen(false);
                  setEditingReservation(null);
                }}
                className="bg-[#f8f6ff] text-[#3b2063]/40 hover:text-[#3b2063] hover:bg-white hover:shadow-md p-3 rounded-2xl transition-all active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (editingReservation) {
                  handleUpdateReservation();
                } else {
                  handleCreateReservation();
                }
              }} 
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 mb-3 ml-2">
                  Reservation Type
                </label>
                <select
                  value={reservationForm.reservationType}
                  onChange={(e) => setReservationForm(f => ({ ...f, reservationType: e.target.value as Reservation['reservationType'] }))}
                  className="w-full px-6 py-4 rounded-3xl border border-[#3b2063]/10 text-sm font-black text-[#3b2063] bg-[#f8f6ff] focus:outline-none focus:ring-8 focus:ring-[#3b2063]/5 focus:bg-white focus:shadow-lg transition-all appearance-none cursor-pointer"
                >
                  <option value="table">Table Reservation</option>
                  <option value="party">Party/Event</option>
                  <option value="meeting">Meeting Room</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 mb-3 ml-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={reservationForm.customerName}
                  onChange={(e) => setReservationForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full px-6 py-4 rounded-3xl border border-[#3b2063]/10 text-sm font-black text-[#3b2063] bg-[#f8f6ff] focus:outline-none focus:ring-8 focus:ring-[#3b2063]/5 focus:bg-white focus:shadow-lg transition-all"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 mb-3 ml-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={reservationForm.customerPhone}
                  onChange={handlePhoneChange}
                  className="w-full px-6 py-4 rounded-3xl border border-[#3b2063]/10 text-sm font-black text-[#3b2063] bg-[#f8f6ff] focus:outline-none focus:ring-8 focus:ring-[#3b2063]/5 focus:bg-white focus:shadow-lg transition-all"
                  placeholder="Ex: 09123456789"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 mb-3 ml-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={reservationForm.partySize}
                    onChange={(e) => setReservationForm(f => ({ ...f, partySize: parseInt(e.target.value) || 1 }))}
                    className="w-full px-6 py-4 rounded-3xl border border-[#3b2063]/10 text-sm font-black text-[#3b2063] bg-[#f8f6ff] focus:outline-none focus:ring-8 focus:ring-[#3b2063]/5 focus:bg-white focus:shadow-lg transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 mb-3 ml-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reservationForm.time}
                    onChange={(e) => setReservationForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-6 py-4 rounded-3xl border border-[#3b2063]/10 text-sm font-black text-[#3b2063] bg-[#f8f6ff] focus:outline-none focus:ring-8 focus:ring-[#3b2063]/5 focus:bg-white focus:shadow-lg transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#3b2063]/40 mb-3 ml-2">
                  Special Notes
                </label>
                <textarea
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-6 py-4 rounded-3xl border border-[#3b2063]/10 text-sm font-black text-[#3b2063] bg-[#f8f6ff] focus:outline-none focus:ring-8 focus:ring-[#3b2063]/5 focus:bg-white focus:shadow-lg transition-all resize-none"
                  rows={3}
                  placeholder="Any dietary restrictions or requests?"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-5 bg-[#3b2063] hover:bg-[#2a1839] text-white rounded-3xl text-base font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl active:scale-95 border-b-4 border-black/20"
                >
                  {editingReservation ? 'Save Changes' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
