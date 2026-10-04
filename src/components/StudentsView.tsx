import React, { useEffect, useMemo, useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  RefreshCw, 
  Plus, 
  Edit2, 
  Trash2, 
  UserX, 
  Calendar, 
  MapPin, 
  Phone, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Student, EmployeeProfile } from '../types';

interface StudentsViewProps {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  profile: EmployeeProfile;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onOpenDeleteModal: (student: Student) => void;
initialGrade?: string;
initialSection?: string;}

type SortField = 'roll_no' | 'full_name' | 'class_grade' | 'admission_date';

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  isLoading,
  error,
  profile,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  initialGrade,
initialSection,
}) => {
  const role = profile.role?.toLowerCase() || 'teacher';
  const isPrincipal = role === 'principal';
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const canAddStudent = isPrincipal || isAdmin;
  const canEditStudent = isPrincipal || isAdmin;
  const canDeleteStudent = isPrincipal; // Only Principals can delete students

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  useEffect(() => {
  setSelectedGrade(initialGrade || 'ALL');
  setSelectedSection(initialSection || 'ALL');
  setCurrentPage(1);
}, [initialGrade, initialSection]);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('roll_no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Unique grade options for filter
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach((s) => {
      if (s.class_grade?.trim()) grades.add(s.class_grade.trim());
    });
    return Array.from(grades).sort();
  }, [students]);

  // Unique section options for filter
  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    students.forEach((s) => {
      if (s.section?.trim()) sections.add(s.section.trim());
    });
    return Array.from(sections).sort();
  }, [students]);

  // Filtering and sorting
  const processedStudents = useMemo(() => {
    let result = students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.full_name?.toLowerCase().includes(q) ||
        String(s.roll_no).toLowerCase().includes(q) ||
        s.guardian_name?.toLowerCase().includes(q) ||
        s.residential_address?.toLowerCase().includes(q);

     const normalizeGrade = (value?: string | null) => {
  const trimmed = value?.trim() || '';

  if (trimmed.toLowerCase().startsWith('grade ')) {
    return trimmed.substring(6).trim();
  }

  return trimmed;
};

const matchGrade =
  selectedGrade === 'ALL' ||
  normalizeGrade(s.class_grade) === normalizeGrade(selectedGrade);
      const matchSection = selectedSection === 'ALL' || s.section?.trim() === selectedSection;
      const matchGender = selectedGender === 'ALL' || s.gender?.toLowerCase() === selectedGender.toLowerCase();

      return matchSearch && matchGrade && matchSection && matchGender;
    });

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'roll_no') {
        const numA = parseInt(valA, 10);
        const numB = parseInt(valB, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, searchQuery, selectedGrade, selectedSection, selectedGender, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(processedStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedStudents.slice(start, start + itemsPerPage);
  }, [processedStudents, currentPage]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Students Roster
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Your School
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Student records for your school.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition disabled:opacity-50 cursor-pointer"
            title="Refresh student list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Student button (Only visible to Principal & Admin) */}
          {canAddStudent && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, roll no, guardian, address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* Grade filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Grades</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Section filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Sections</option>
              {uniqueSections.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          {/* Gender filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* View toggle & count */}
          <div className="lg:col-span-2 flex items-center justify-end gap-2">
            <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-16 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-200">
            Loading students...
          </p>
          <p className="text-xs text-slate-500">
            Loading student records
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-5 bg-rose-950/30 border border-rose-500/40 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-200">Unable to load students</h4>
            <p className="text-xs text-slate-300 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State (0 students in records) */}
      {!isLoading && !error && students.length === 0 && (
        <div className="p-16 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <UserX className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white">No students enrolled yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no student records registered for this school.
          </p>
          {canAddStudent && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
            >
              <Plus className="h-4 w-4" />
              <span>Enroll First Student</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State when filters yield no results */}
      {!isLoading && !error && students.length > 0 && processedStudents.length === 0 && (
        <div className="p-12 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
          <Search className="h-7 w-7 text-slate-500 mx-auto" />
          <p className="text-sm font-medium text-slate-200">No matching student records</p>
          <p className="text-xs text-slate-500">
            No students match your active filters or search terms.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedGrade('ALL');
              setSelectedSection('ALL');
              setSelectedGender('ALL');
            }}
            className="text-xs text-blue-400 hover:underline pt-1"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* Teacher View Disclaimer */}
      {isTeacher && (
        <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-xs text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-400 shrink-0" />
            <span>
              Teacher View: Displaying simplified classroom demographics (Roll Number, Name, Class, Section, Gender, Date of Birth).
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Read-Only access
          </span>
        </div>
      )}

      {/* TABLE VIEW: Role-customized fields */}
      {!isLoading && !error && paginatedStudents.length > 0 && viewMode === 'table' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80 uppercase font-semibold text-[11px] tracking-wider">
                  {/* 1. Roll No */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort('roll_no')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Roll Number</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* 2. Full Name */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort('full_name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Full Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* 3. Class / Grade & 4. Section */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort('class_grade')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Class / Section</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* 5. Gender */}
                  <th className="py-3 px-4">Gender</th>

                  {/* 6. Date of Birth */}
                  <th className="py-3 px-4">Date of Birth</th>

                  {/* Fields 7-10: Only for Principal & Admin */}
                  {!isTeacher && (
                    <>
                      {/* 7. Guardian Name & 8. Guardian Phone */}
                      <th className="py-3 px-4">Guardian Contact</th>

                      {/* 9. Residential Address */}
                      <th className="py-3 px-4">Residential Address</th>

                      {/* 10. Admission Date */}
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-white transition"
                        onClick={() => toggleSort('admission_date')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Admission Date</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Actions column */}
                      <th className="py-3 px-4 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/60 transition">
                    {/* Roll Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      {student.roll_no || '—'}
                    </td>

                    {/* Full Name */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{student.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {student.id}</p>
                    </td>

                    {/* Class / Grade & Section */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                        Grade {student.class_grade || '—'}
                      </span>
                      {student.section && (
                        <span className="ml-1 text-slate-400">
                          (Sec {student.section})
                        </span>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="py-3.5 px-4 text-slate-300 capitalize">
                      {student.gender || '—'}
                    </td>

                    {/* Date of Birth */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span>{student.date_of_birth || '—'}</span>
                      </div>
                    </td>

                    {/* Non-Teacher Columns: Guardian, Address, Admission Date, Actions */}
                    {!isTeacher && (
                      <>
                        {/* Guardian Name & Guardian Phone */}
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-200">{student.guardian_name || '—'}</p>
                          {student.guardian_phone && (
                            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-500" />
                              <span>{student.guardian_phone}</span>
                            </p>
                          )}
                        </td>

                        {/* Residential Address */}
                        <td className="py-3.5 px-4 text-slate-300 max-w-[200px]">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                            <span className="truncate block" title={student.residential_address}>
                              {student.residential_address || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Admission Date */}
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {student.admission_date || '—'}
                        </td>

                        {/* Actions: Edit & Principal-Only Delete */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Student */}
                            {canEditStudent && (
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(student)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-blue-400 border border-slate-800 transition cursor-pointer"
                                title="Edit student"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Delete Student (ONLY PRINCIPALS SEE THIS BUTTON) */}
                            {canDeleteStudent && (
                              <button
                                type="button"
                                onClick={() => onOpenDeleteModal(student)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition cursor-pointer"
                                title="Delete student (Principal only)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="px-6 py-3.5 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(currentPage * itemsPerPage, processedStudents.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-200">{processedStudents.length}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3 py-1 font-mono text-slate-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARDS VIEW FOR RESPONSIVE/MOBILE USE */}
      {!isLoading && !error && paginatedStudents.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedStudents.map((student) => (
            <div
              key={student.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Roll #{student.roll_no}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1.5">
                      {student.full_name}
                    </h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                    Grade {student.class_grade} ({student.section || '—'})
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender:</span>
                    <span className="text-slate-300 capitalize">{student.gender || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="text-slate-300">{student.date_of_birth || '—'}</span>
                  </div>

                  {!isTeacher && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Admission Date:</span>
                        <span className="font-mono text-slate-300">{student.admission_date || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Guardian:</span>
                        <span className="text-slate-200 font-medium">{student.guardian_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-mono text-slate-300">{student.guardian_phone || '—'}</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-slate-500 block text-[11px]">Address:</span>
                        <span className="text-slate-300 text-[11px] leading-tight block mt-0.5">
                          {student.residential_address || '—'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Actions (Hidden for Teacher) */}
              {!isTeacher && (
                <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-end gap-2">
                  {canEditStudent && (
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(student)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  )}

                  {canDeleteStudent && (
                    <button
                      type="button"
                      onClick={() => onOpenDeleteModal(student)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-medium border border-rose-800/40 flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
