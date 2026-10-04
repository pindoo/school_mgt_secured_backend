import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Edit3, 
  RefreshCw, 
  AlertCircle, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Hash,
  ShieldCheck
} from 'lucide-react';
import { Student, StudentFormData } from '../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<{ success: boolean; error?: string | null }>;
  studentToEdit?: Student | null;
  schoolId: number;
  schoolName?: string;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentToEdit,
  schoolId,
  schoolName,
}) => {
  const isEditing = Boolean(studentToEdit);

  const [formData, setFormData] = useState<StudentFormData>({
    roll_no: '',
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    class_grade: '',
    section: 'A',
    guardian_name: '',
    guardian_phone: '',
    residential_address: '',
    admission_date: new Date().toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        roll_no: String(studentToEdit.roll_no || ''),
        full_name: studentToEdit.full_name || '',
        date_of_birth: studentToEdit.date_of_birth || '',
        gender: studentToEdit.gender || 'Male',
        class_grade: String(studentToEdit.class_grade || ''),
        section: studentToEdit.section || 'A',
        guardian_name: studentToEdit.guardian_name || '',
        guardian_phone: studentToEdit.guardian_phone || '',
        residential_address: studentToEdit.residential_address || '',
        admission_date: studentToEdit.admission_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        roll_no: '',
        full_name: '',
        date_of_birth: '',
        gender: 'Male',
        class_grade: '',
        section: 'A',
        guardian_name: '',
        guardian_phone: '',
        residential_address: '',
        admission_date: new Date().toISOString().split('T')[0],
      });
    }
    setErrorMsg(null);
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!formData.roll_no.trim()) {
      setErrorMsg('Roll number is required.');
      return;
    }
    if (!formData.full_name.trim()) {
      setErrorMsg('Student full name is required.');
      return;
    }
    if (!formData.class_grade.trim()) {
      setErrorMsg('Class / Grade is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to save student record to Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {isEditing ? 'Edit Student Record' : 'Enroll New Student'}
              </h3>
              <p className="text-xs text-slate-400">
                School: <span className="text-slate-300 font-medium">{schoolName || `#${schoolId}`}</span> • Auto-assigned School ID #{schoolId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to save student</p>
              <p className="text-slate-300 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Row 1: Roll No & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="h-3 w-3 text-blue-400" />
                Roll Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 101 or LGS-042"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <User className="h-3 w-3 text-blue-400" />
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Student full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Class/Grade, Section & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-blue-400" />
                Class / Grade <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 9, 10, O-Level"
                value={formData.class_grade}
                onChange={(e) => setFormData({ ...formData, class_grade: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                placeholder="e.g. A, B, Green"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-blue-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 3: Date of Birth & Admission Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Admission Date
              </label>
              <input
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 4: Guardian Name & Guardian Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Guardian Name
              </label>
              <input
                type="text"
                placeholder="Parent / Guardian full name"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                Guardian Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. +92 300 1234567"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 5: Residential Address */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              Residential Address
            </label>
            <textarea
              rows={2}
              placeholder="Full home / residential address"
              value={formData.residential_address}
              onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Security notice regarding school_id */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              School ID is automatically locked to <strong className="text-white font-mono">#{schoolId}</strong> to uphold Row Level Security.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium flex items-center gap-2 transition disabled:opacity-60 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving student...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Confirm Enrollment'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
