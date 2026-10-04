import React, { useMemo } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Student, School, EmployeeProfile } from '../types';

interface ClassesViewProps {
  students: Student[];
  school: School | null;
  profile: EmployeeProfile;
  onSelectClass: (grade: string, section?: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  students,
  school,
  profile,
  onSelectClass,
}) => {
  // Normalize grade values so:
  // "6" and "Grade 6" are treated as the same grade.
  const normalizeGrade = (value?: string | null) => {
    const trimmed = value?.trim() || 'General';

    if (trimmed.toLowerCase().startsWith('grade ')) {
      return trimmed.substring(6).trim() || 'General';
    }

    return trimmed;
  };

  // Aggregate students by Class/Grade
  const classesData = useMemo(() => {
    const map: Record<
      string,
      {
        grade: string;
        total: number;
        sections: Set<string>;
        boys: number;
        girls: number;
      }
    > = {};

    students.forEach((s) => {
      const g = normalizeGrade(s.class_grade);

      if (!map[g]) {
        map[g] = {
          grade: g,
          total: 0,
          sections: new Set<string>(),
          boys: 0,
          girls: 0,
        };
      }

      map[g].total += 1;

      if (s.section?.trim()) {
        map[g].sections.add(s.section.trim());
      }

      if (s.gender?.toLowerCase() === 'female') {
        map[g].girls += 1;
      } else if (s.gender?.toLowerCase() === 'male') {
        map[g].boys += 1;
      }
    });

    return Object.values(map).sort((a, b) =>
      a.grade.localeCompare(b.grade, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Classroom & Academic Hierarchy
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Academic Classes
          </h2>

          <p className="text-xs text-slate-400">
            Active grades and class distribution for{' '}
            <span className="text-slate-300 font-medium">
              {school?.school_name || `School #${profile.school_id}`}
            </span>
            .
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          Total Class Groups:{' '}
          <strong className="text-white">{classesData.length}</strong>
        </div>
      </div>

      {/* Classes Grid */}
      {classesData.length === 0 ? (
        <div className="p-16 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
          <BookOpen className="h-8 w-8 text-slate-500 mx-auto opacity-40" />

          <h3 className="text-sm font-semibold text-slate-200">
            No classes registered
          </h3>

          <p className="text-xs text-slate-500">
            Enroll students to automatically generate class rosters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classesData.map((cls) => {
            const sectionsArray = Array.from(cls.sections).sort(
              (a, b) => a.localeCompare(b, undefined, { numeric: true })
            );

            return (
              <div
                key={cls.grade}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Class Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Academic Class
                      </span>

                      <h3 className="text-lg font-bold text-white mt-0.5">
                        Grade {cls.grade}
                      </h3>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                      {cls.total} Students
                    </span>
                  </div>

                  {/* Sections list */}
                  <div className="mt-4 pt-3 border-t border-slate-900 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">
                        Active Sections:
                      </span>

                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {sectionsArray.length > 0 ? (
                          sectionsArray.map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() =>
                                onSelectClass(cls.grade, sec)
                              }
                              className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-blue-400 hover:border-blue-500/40 transition cursor-pointer"
                              title={`View Grade ${cls.grade}, Section ${sec}`}
                            >
                              Sec {sec}
                            </button>
                          ))
                        ) : (
                          <span className="text-slate-500">General</span>
                        )}
                      </div>
                    </div>

                    {/* Gender Distribution */}
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Boys / Girls:
                      </span>

                      <span className="text-slate-200 font-mono">
                        {cls.boys} Boys • {cls.girls} Girls
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Whole Grade Roster */}
                <div className="mt-5 pt-3 border-t border-slate-900 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectClass(cls.grade)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Roster</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
