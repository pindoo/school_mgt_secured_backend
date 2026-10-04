import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Check, 
  X, 
  Clock, 
  Filter, 
  Save, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { Student, School, EmployeeProfile } from '../types';

interface AttendanceViewProps {
  students: Student[];
  school: School | null;
  profile: EmployeeProfile;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  school,
  profile,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Unique grades
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach((s) => {
      if (s.class_grade?.trim()) grades.add(s.class_grade.trim());
    });
    return Array.from(grades).sort();
  }, [students]);

  // Unique sections (based on selected grade or all)
  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    students.forEach((s) => {
      if (selectedGrade === 'ALL' || s.class_grade?.trim() === selectedGrade) {
        if (s.section?.trim()) sections.add(s.section.trim());
      }
    });
    return Array.from(sections).sort();
  }, [students, selectedGrade]);

  // Filtered students for attendance
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGrade = selectedGrade === 'ALL' || s.class_grade?.trim() === selectedGrade;
      const matchSection = selectedSection === 'ALL' || s.section?.trim() === selectedSection;
      return matchGrade && matchSection;
    });
  }, [students, selectedGrade, selectedSection]);

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = { ...attendanceMap };
    filteredStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Stats calculation
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;

    filteredStudents.forEach((s) => {
      const status = attendanceMap[s.id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unmarked++;
    });

    const totalMarked = present + absent + late;
    const rate = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : 100;

    return { present, absent, late, unmarked, rate };
  }, [filteredStudents, attendanceMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Daily Classroom Roll Call
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Attendance Register
          </h2>
          <p className="text-xs text-slate-400">
            Record and review student attendance for <span className="text-slate-300 font-medium">{school?.school_name || `School #${profile.school_id}`}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/20 self-start md:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>Save Attendance Register</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Attendance register saved for {selectedDate}!</span>
        </div>
      )}

      {/* Date, Class filter & quick mark buttons */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Date input */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Class filter */}
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedSection('ALL');
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Classes ({students.length} students)</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>Class / Grade {g}</option>
              ))}
            </select>

            {/* Section filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Quick Mark Batch Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <span className="text-xs text-slate-400 mr-1">Batch:</span>
            <button
              type="button"
              onClick={() => markAll('present')}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={() => markAll('late')}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Mark All Late
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <p className="text-[11px] uppercase font-semibold text-slate-400">Present</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{stats.present}</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <p className="text-[11px] uppercase font-semibold text-slate-400">Absent</p>
          <p className="text-xl font-bold font-mono text-rose-400 mt-0.5">{stats.absent}</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <p className="text-[11px] uppercase font-semibold text-slate-400">Late</p>
          <p className="text-xl font-bold font-mono text-amber-400 mt-0.5">{stats.late}</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <p className="text-[11px] uppercase font-semibold text-slate-400">Attendance Rate</p>
          <p className="text-xl font-bold font-mono text-blue-400 mt-0.5">{stats.rate}%</p>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No students found in the selected class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4 text-center">Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((s) => {
                  const currentStatus = attendanceMap[s.id] || 'present';

                  return (
                    <tr key={s.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {s.roll_no}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {s.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        Grade {s.class_grade} ({s.section})
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStatus(s.id, 'present')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatus(s.id, 'absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-rose-300 border border-slate-800'
                            }`}
                          >
                            <X className="h-3 w-3" />
                            <span>Absent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatus(s.id, 'late')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>Late</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
