import React, { useMemo } from 'react';
import { 
  BarChart3, 
  GraduationCap, 
  Users, 
  Calendar, 
  PieChart, 
  ArrowUpRight, 
  TrendingUp,
  Download
} from 'lucide-react';
import { Student, School, EmployeeProfile } from '../types';

interface ReportsViewProps {
  students: Student[];
  school: School | null;
  profile: EmployeeProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  school,
  profile,
}) => {
  const isTeacher = profile?.role?.toLowerCase() === 'teacher';

  // 1. Students by Grade
  const gradeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const g = s.class_grade?.trim() || 'Unassigned';
      map[g] = (map[g] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [students]);

  // 2. Students by Gender
  const genderDistribution = useMemo(() => {
    const map: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    students.forEach((s) => {
      const g = s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1).toLowerCase() : 'Other';
      if (map[g] !== undefined) {
        map[g] += 1;
      } else {
        map['Other'] += 1;
      }
    });
    return map;
  }, [students]);

  // 3. Students by Section
  const sectionDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const sec = s.section?.trim() || 'A';
      map[sec] = (map[sec] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [students]);

  // 4. Admissions timeline (by Month/Year)
  const admissionsTimeline = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      if (s.admission_date) {
        // e.g. "2026-03"
        const key = s.admission_date.slice(0, 7);
        map[key] = (map[key] || 0) + 1;
      } else {
        map['Earlier'] = (map['Earlier'] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  }, [students]);

  // CSV Export utility
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = [
      'Roll No',
      'Full Name',
      'Class/Grade',
      'Section',
      'Gender',
      'Date of Birth',
      'Guardian Name',
      'Guardian Phone',
      'Residential Address',
      'Admission Date',
    ];
    const rows = students.map((s) => [
      `"${s.roll_no || ''}"`,
      `"${s.full_name || ''}"`,
      `"${s.class_grade || ''}"`,
      `"${s.section || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.date_of_birth || ''}"`,
      `"${s.guardian_name || ''}"`,
      `"${s.guardian_phone || ''}"`,
      `"${s.residential_address?.replace(/"/g, '""') || ''}"`,
      `"${s.admission_date || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_report_school_${profile.school_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const total = students.length || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
            <BarChart3 className="h-3.5 w-3.5" />
            {isTeacher ? 'Academic Class Demographics (Teacher Limited View)' : 'School Analytics & Demographics'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isTeacher ? 'Academic Class Reports' : 'Institutional Reports'}
          </h2>
          <p className="text-xs text-slate-400">
            {isTeacher 
              ? `Class and section distributions for ${school?.school_name || `School #${profile.school_id}`}.`
              : `Real-time enrollment metrics for ${school?.school_name || `School #${profile.school_id}`}.`}
          </p>
        </div>

        {!isTeacher ? (
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Report</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono self-start sm:self-auto">
            Teacher View • Limited Analytics
          </div>
        )}
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Students</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">{students.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Active Enrollment
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase font-semibold">Active Classes</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">{gradeDistribution.length}</p>
          <p className="text-[11px] text-blue-400 mt-1">Grade levels offered</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase font-semibold">Male / Female Ratio</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">
            {genderDistribution.Male} : {genderDistribution.Female}
          </p>
          <p className="text-[11px] text-purple-400 mt-1">Gender distribution</p>
        </div>
      </div>

      {/* Grid: Grades & Gender Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Grade Distribution Bar Meters */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span>Students by Class / Grade</span>
          </h3>

          {gradeDistribution.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No grade data available.</p>
          ) : (
            <div className="space-y-3 pt-2">
              {gradeDistribution.map(([grade, count]) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={grade} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">Grade {grade}</span>
                      <span className="text-slate-400 font-mono">
                        {count} students ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gender Breakdown */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-400" />
            <span>Students by Gender</span>
          </h3>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-semibold">Male</span>
                <span className="text-slate-300 font-mono">
                  {genderDistribution.Male} ({Math.round((genderDistribution.Male / total) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(genderDistribution.Male / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-pink-400 font-semibold">Female</span>
                <span className="text-slate-300 font-mono">
                  {genderDistribution.Female} ({Math.round((genderDistribution.Female / total) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${(genderDistribution.Female / total) * 100}%` }}
                />
              </div>
            </div>

            {genderDistribution.Other > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-semibold">Other / Unspecified</span>
                  <span className="text-slate-300 font-mono">{genderDistribution.Other}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(genderDistribution.Other / total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Sections & Admissions History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sections Distribution */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Students by Section
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {sectionDistribution.map(([sec, count]) => (
              <div key={sec} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Section {sec}</span>
                <span className="text-xl font-bold font-mono text-white block mt-0.5">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admissions by Date/Month */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>Admissions by Month</span>
          </h3>
          <div className="space-y-2 pt-1">
            {admissionsTimeline.map(([period, count]) => (
              <div key={period} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                <span className="font-mono text-slate-300">{period}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
                  {count} enrolled
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
