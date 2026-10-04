import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Student } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onConfirm: (studentId: number) => Promise<{ success: boolean; error?: string | null }>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    const result = await onConfirm(student.id);
    setIsDeleting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to delete the student record.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Are you sure you want to delete this student?
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            This action cannot be undone. The student record will be permanently deleted from the school database.
          </p>
        </div>

        {/* Target student details */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
          <p className="font-semibold text-white">{student.full_name}</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Roll No: <strong className="text-slate-200 font-mono">{student.roll_no}</strong></span>
            <span>•</span>
            <span>Grade {student.class_grade} ({student.section})</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-lg shadow-rose-600/20"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting student...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
