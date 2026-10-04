import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  GraduationCap, 
  Calendar, 
  Phone, 
  MapPin, 
  Hash, 
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';
import { EmployeeProfile, School, StudentFormData, Student } from '../types';

interface AdmissionsViewProps {
  profile: EmployeeProfile;
  school: School | null;
  students?: Student[];
  onEnroll: (data: StudentFormData) => Promise<{ success: boolean; student?: Student | null; error?: string | null }>;
  onViewRoster: () => void;
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({
  profile,
  school,
  students = [],
  onEnroll,
  onViewRoster,
}) => {
  const isTeacher = profile?.role?.toLowerCase() === 'teacher';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrolledStudent, setEnrolledStudent] = useState<Student | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setEnrolledStudent(null);

    if (!formData.roll_no.trim()) {
      setErrorMessage('Roll Number is required.');
      return;
    }
    if (!formData.full_name.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!formData.class_grade.trim()) {
      setErrorMessage('Class / Grade is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await onEnroll(formData);
    setIsSubmitting(false);

    if (result.success && result.student) {
      setEnrolledStudent(result.student);
      // Reset form
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
    } else {
      setErrorMessage(result.error || 'Failed to complete admission.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-1">
              <UserPlus className="h-3.5 w-3.5" />
              Student Intake Portal
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              New Student Admissions
            </h2>
            <p className="text-xs text-slate-400">
              Register and enroll new pupils into <span className="text-white font-medium">{school?.school_name || `School #${profile.school_id}`}</span>.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {enrolledStudent && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 shadow-lg space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm text-emerald-200">
                Admission Successful!
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong className="text-white">{enrolledStudent.full_name}</strong> (Roll No: <span className="font-mono text-emerald-400">{enrolledStudent.roll_no}</span>) has been enrolled into Grade {enrolledStudent.class_grade} ({enrolledStudent.section}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1 pl-8">
            <button
              type="button"
              onClick={onViewRoster}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <span>View in Students Roster</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEnrolledStudent(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Enroll Another Student
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Admission Failed</p>
            <p className="text-slate-300 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Teacher View (Read-Only Admissions Directory) */}
      {isTeacher ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Admissions Directory (Teacher View)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                As a Teacher, your admissions access is set to <strong>Read-Only</strong>. Student enrollment and intake forms are authorized for School Principals and Administrators. Below are the recent student admissions recorded for <span className="font-semibold text-white">{school?.school_name || `School #${profile.school_id}`}</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Recent School Intakes ({students.length} Total Enrolled)
              </h3>
              <button
                type="button"
                onClick={onViewRoster}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <span>Full Student Roster</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {students.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                No admissions recorded yet for your school.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
                {students.slice(0, 10).map((s) => (
                  <div key={s.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {s.roll_no ? String(s.roll_no).slice(0, 3) : '#'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400">
                          Grade {s.class_grade} ({s.section || 'A'}) • Roll No: <span className="font-mono text-slate-300">{s.roll_no}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">{s.admission_date || 'Enrolled'}</span>
                      <span className="text-[10px] text-emerald-400">Enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Intake Form (Principal & Admin) */
        <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Section A: Academic Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span>Academic & Enrollment Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-blue-400" />
                Roll Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-101"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Class / Grade <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 8, 9, 10, Matric"
                value={formData.class_grade}
                onChange={(e) => setFormData({ ...formData, class_grade: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Section
              </label>
              <input
                type="text"
                placeholder="e.g. A, B, C"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Admission Date
              </label>
              <input
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                School ID Assignment
              </label>
              <div className="px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between font-mono">
                <span>Assigned to this school</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Student Demographics */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <User className="h-4 w-4 text-blue-400" />
            <span>Student Personal Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Student full legal name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-blue-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full max-w-sm px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Section C: Guardian & Contact Details */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Phone className="h-4 w-4 text-blue-400" />
            <span>Guardian & Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Guardian / Parent Name
              </label>
              <input
                type="text"
                placeholder="Parent or legal guardian name"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Guardian Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +92 300 1234567"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Residential Address
            </label>
            <textarea
              rows={2}
              placeholder="Residential address of student and family..."
              value={formData.residential_address}
              onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving student record...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Complete Student Enrollment</span>
              </>
            )}
          </button>
        </div>

        </form>
      )}
    </div>
  );
};
