'use client';

import React, { useState, useMemo } from 'react';
import { X, Check, Eye, HelpCircle } from 'lucide-react';
import { renderSingleFormula } from '@/app/utils/mathRenderer';

interface MathFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (formattedFormula: string) => void;
}

interface SymbolPreset {
  label: string;
  latex: string;
  description: string;
}

const PRESET_GROUPS: { name: string; items: SymbolPreset[] }[] = [
  {
    name: 'Pecahan, Akar & Pangkat',
    items: [
      { label: 'a/b', latex: '\\frac{a}{b}', description: 'Pecahan' },
      { label: '√x', latex: '\\sqrt{x}', description: 'Akar Kuadrat' },
      { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', description: 'Akar Pangkat n' },
      { label: 'xⁿ', latex: 'x^{n}', description: 'Pangkat' },
      { label: 'xₙ', latex: 'x_{n}', description: 'Indeks Bawah' },
      { label: 'xₙ²', latex: 'x_{n}^{2}', description: 'Indeks & Pangkat' },
    ],
  },
  {
    name: 'Operasi & Relasi',
    items: [
      { label: '±', latex: '\\pm', description: 'Plus Minus' },
      { label: '×', latex: '\\times', description: 'Perkalian' },
      { label: '÷', latex: '\\div', description: 'Pembagian' },
      { label: '·', latex: '\\cdot', description: 'Titik Perkalian' },
      { label: '≤', latex: '\\leq', description: 'Kurang Dari atau Sama Dengan' },
      { label: '≥', latex: '\\geq', description: 'Lebih Dari atau Sama Dengan' },
      { label: '≠', latex: '\\neq', description: 'Tidak Sama Dengan' },
      { label: '≈', latex: '\\approx', description: 'Mendekati / Kira-kira' },
      { label: '∞', latex: '\\infty', description: 'Tak Hingga' },
      { label: '°', latex: '^\\circ', description: 'Derajat' },
    ],
  },
  {
    name: 'Kalkulus & Aljabar',
    items: [
      { label: '∫ dx', latex: '\\int f(x) \\, dx', description: 'Integral Tak Tentu' },
      { label: '∫ₐᵇ', latex: '\\int_{a}^{b} f(x) \\, dx', description: 'Integral Tertentu' },
      { label: '∑', latex: '\\sum_{i=1}^{n} x_i', description: 'Notasi Sigma' },
      { label: 'lim', latex: '\\lim_{x \\to 0} f(x)', description: 'Limit Fungsi' },
      { label: 'Matriks 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', description: 'Matriks 2x2' },
      { label: 'Vektor', latex: '\\vec{v}', description: 'Vektor' },
    ],
  },
  {
    name: 'Huruf Yunani',
    items: [
      { label: 'α', latex: '\\alpha', description: 'Alpha' },
      { label: 'β', latex: '\\beta', description: 'Beta' },
      { label: 'γ', latex: '\\gamma', description: 'Gamma' },
      { label: 'θ', latex: '\\theta', description: 'Theta' },
      { label: 'π', latex: '\\pi', description: 'Pi' },
      { label: 'Δ', latex: '\\Delta', description: 'Delta' },
      { label: 'λ', latex: '\\lambda', description: 'Lambda' },
      { label: 'ω', latex: '\\omega', description: 'Omega' },
    ],
  },
  {
    name: 'Trigonometri & Logaritma',
    items: [
      { label: 'sin', latex: '\\sin(x)', description: 'Sinus' },
      { label: 'cos', latex: '\\cos(x)', description: 'Cosinus' },
      { label: 'tan', latex: '\\tan(x)', description: 'Tangen' },
      { label: 'log', latex: '\\log(x)', description: 'Logaritma' },
      { label: 'ln', latex: '\\ln(x)', description: 'Logaritma Natural' },
    ],
  },
];

export default function MathFormulaModal({ isOpen, onClose, onInsert }: MathFormulaModalProps) {
  const [formula, setFormula] = useState('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [isBlockMode, setIsBlockMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Live KaTeX preview
  const previewHtml = useMemo(() => {
    if (!formula.trim()) return '';
    return renderSingleFormula(formula, isBlockMode);
  }, [formula, isBlockMode]);

  if (!isOpen) return null;

  const handleInsertSymbol = (latex: string) => {
    setFormula((prev) => (prev ? `${prev} ${latex}` : latex));
  };

  const handleInsertToEditor = () => {
    const trimmed = formula.trim();
    if (!trimmed) {
      alert('Silakan tuliskan rumus matematika terlebih dahulu.');
      return;
    }

    const formatted = isBlockMode ? `$$${trimmed}$$` : `$${trimmed}$`;
    onInsert(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121216] border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-crypto-accent/20 border border-crypto-accent/30 flex items-center justify-center text-crypto-accent font-bold">
              ∑
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tulis Rumus Matematika (LaTeX)</h3>
              <p className="text-xs text-gray-400">Pilih simbol atau ketik formula matematika standar LaTeX</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-gray-200">
          {/* Tabs Kategori Simbol */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Palet Simbol Cepat
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-800">
              {PRESET_GROUPS.map((group, idx) => (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                    activeTab === idx
                      ? 'bg-crypto-accent text-white shadow-neon'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>

            {/* Tombol Simbol pada Tab Aktif */}
            <div className="flex flex-wrap gap-2 pt-2 bg-black/40 p-3 rounded-xl border border-gray-800/80">
              {PRESET_GROUPS[activeTab].items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleInsertSymbol(item.latex)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 hover:border-crypto-accent border border-gray-700 rounded-lg text-sm font-medium text-white transition flex items-center gap-1.5 active:scale-95"
                  title={`${item.description} (${item.latex})`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Tampilan: Inline vs Block */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pilihan Format Tampilan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsBlockMode(false)}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  !isBlockMode
                    ? 'border-crypto-accent bg-crypto-accent/10 shadow-neon'
                    : 'border-gray-800 bg-gray-900/40 hover:bg-gray-800/50'
                }`}
              >
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-crypto-accent font-mono">$...$</span> Inline (Sebaris Teks)
                </span>
                <span className="text-xs text-gray-400">
                  Rumus menyatu di dalam kalimat (contoh: Nilai $x = 5$).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsBlockMode(true)}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isBlockMode
                    ? 'border-crypto-accent bg-crypto-accent/10 shadow-neon'
                    : 'border-gray-800 bg-gray-900/40 hover:bg-gray-800/50'
                }`}
              >
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-crypto-accent font-mono">$$...$$</span> Block (Tengah Baris)
                </span>
                <span className="text-xs text-gray-400">
                  Rumus tampil di baris tersendiri dan berada di posisi tengah.
                </span>
              </button>
            </div>
          </div>

          {/* Input Kode LaTeX */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Kode LaTeX Rumus
              </label>
              <span className="text-xs text-gray-500 font-mono">
                {isBlockMode ? '$$' : '$'}
                {formula}
                {isBlockMode ? '$$' : '$'}
              </span>
            </div>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Contoh: \frac{a}{b} atau \sqrt{x^2 + y^2}"
              rows={3}
              className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-crypto-accent focus:border-transparent transition"
            />
          </div>

          {/* Live Preview Box */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-crypto-accent" />
              Pratinjau Hasil Rumus (Live Preview)
            </label>
            <div className="min-h-[90px] p-4 bg-gray-900/90 border border-gray-700/80 rounded-xl flex items-center justify-center overflow-x-auto shadow-inner">
              {previewHtml ? (
                <div
                  className="text-white text-lg"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <span className="text-sm text-gray-500 italic">
                  Belum ada rumus yang diketik.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            <HelpCircle className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              Tips: Jika mengunggah soal melalui file Excel, Anda juga bisa langsung mengetikkan format seperti{' '}
              <code className="font-mono bg-blue-950 px-1 py-0.5 rounded text-blue-200">$x^2 + 5 = 14$</code>.
            </span>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-800 bg-gray-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleInsertToEditor}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-crypto-accent hover:bg-crypto-accent-hover rounded-xl shadow-neon transition"
          >
            <Check className="w-4 h-4" />
            Sisipkan Rumus ke Soal
          </button>
        </div>
      </div>
    </div>
  );
}
