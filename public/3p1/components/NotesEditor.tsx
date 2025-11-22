import React, { useState, useEffect } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface NotesEditorProps {
  initialNotes: string;
  onSave: (notes: string) => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({ initialNotes, onSave }) => {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    onSave(val);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full flex flex-col print-break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
        <PencilSquareIcon className="w-4 h-4" />
        Notes d'Analyste
      </h3>
      <textarea
        className="w-full flex-1 p-3 border border-gray-200 rounded bg-yellow-50/30 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-700 resize-none min-h-[150px]"
        placeholder="Entrez vos observations qualitatives ici (Moat, Management, Risques...)"
        value={notes}
        onChange={handleChange}
      />
    </div>
  );
};