import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  ClipboardList,
  CalendarPlus,
} from 'lucide-react';
import { DR_EMILY_CHEN } from '../data/mockData';
import { Appointment } from '../types';

interface VisitsTabProps {
  appointments: Appointment[];
  onPrepVisit: (appointment: Appointment) => void;
  onRequestAppointment: () => void;
}

export const VisitsTab: React.FC<VisitsTabProps> = ({ appointments, onPrepVisit, onRequestAppointment }) => {
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>(appointments);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(DR_EMILY_CHEN.name);
  const [selectedDate, setSelectedDate] = useState('2023-12-10');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [visitReason, setVisitReason] = useState('Follow-up Lab Review');
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      doctorName: selectedDoctor,
      doctorRole: selectedDoctor.includes('Chen') ? 'Primary Physician' : 'Specialist Physician',
      doctorAvatar: DR_EMILY_CHEN.avatar,
      date: new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: selectedTime,
      location: 'Central Health Medical Center - Suite 402',
      type: visitReason,
      status: 'upcoming',
    };

    setAppointmentsList([newApt, ...appointmentsList]);
    setScheduledSuccess(true);
    setTimeout(() => {
      setScheduledSuccess(false);
      setShowScheduleModal(false);
    }, 1500);
  };

  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header & Book Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-xl text-on-surface">Appointments & Visits</h1>
          <p className="text-xs text-on-surface-variant">Schedule and manage care consultations</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Book Visit
        </button>
      </div>

      {/* Request New Appointment */}
      <button
        onClick={onRequestAppointment}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-primary/30 text-primary font-bold text-sm rounded-2xl hover:bg-primary/5 transition-colors"
      >
        <CalendarPlus className="w-5 h-5" />
        Request New Appointment
      </button>

      {/* Upcoming Visits List */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm text-on-surface uppercase tracking-wider text-outline">
          Upcoming Appointments
        </h2>
        {appointmentsList
          .filter((a) => a.status === 'upcoming')
          .map((apt) => (
            <div
              key={apt.id}
              className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img
                    src={apt.doctorAvatar}
                    alt={apt.doctorName}
                    className="w-12 h-12 rounded-full object-cover border border-outline-variant"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{apt.doctorName}</h3>
                    <p className="text-xs text-on-surface-variant">{apt.doctorRole}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary-fixed text-primary font-bold text-[10px] rounded-md">
                      {apt.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-outline-variant/40">
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{apt.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>{apt.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container p-2.5 rounded-xl">
                <MapPin className="w-4 h-4 text-outline shrink-0" />
                <span className="truncate">{apt.location}</span>
              </div>

              <button
                onClick={() => onPrepVisit(apt)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary-fixed/30 active:scale-95 transition-all"
              >
                <ClipboardList className="w-4 h-4" /> Prepare for Visit
              </button>
            </div>
          ))}
      </section>

      {/* Past Visits History */}
      <section className="space-y-3 pt-2">
        <h2 className="font-bold text-sm text-on-surface uppercase tracking-wider text-outline">
          Past Visit History
        </h2>
        {appointmentsList
          .filter((a) => a.status === 'completed')
          .map((apt) => (
            <div
              key={apt.id}
              className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-container text-secondary rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">{apt.type}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {apt.doctorName} • {apt.date}
                  </p>
                </div>
              </div>
              <span className="text-xs text-secondary font-bold">Completed</span>
            </div>
          ))}
      </section>

      {/* Schedule Visit Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-on-surface">Book New Appointment</h3>

            {scheduledSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-secondary mx-auto" />
                <p className="font-bold text-sm text-on-surface">Appointment Confirmed!</p>
                <p className="text-xs text-on-surface-variant">Your visit has been scheduled and added to your portal.</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Select Provider</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface"
                  >
                    <option value={DR_EMILY_CHEN.name}>{DR_EMILY_CHEN.name} (Primary Physician)</option>
                    <option value="Dr. Marcus Vance">Dr. Marcus Vance (Cardiologist)</option>
                    <option value="Central Lab Diagnostics">Central Lab Diagnostics (Blood Draw)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Reason for Visit</label>
                  <input
                    type="text"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Preferred Time</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full shadow-md hover:bg-primary/95"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
