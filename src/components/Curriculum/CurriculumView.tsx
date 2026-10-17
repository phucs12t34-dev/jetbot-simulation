import React, { useState } from 'react';
import { CURRICULUM_SLIDES } from '../../utils/curriculumSlides';
import { ViewMode } from '../../types/jetbot';
import { soundFx } from '../../utils/audio';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  GraduationCap,
  Lightbulb,
  Maximize2,
  CheckCircle2,
  Sigma,
  Sparkles,
} from 'lucide-react';

interface CurriculumViewProps {
  onSelectMode: (mode: ViewMode) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({ onSelectMode }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const slide = CURRICULUM_SLIDES[currentSlideIndex];

  const nextSlide = () => {
    soundFx.playClick();
    setCurrentSlideIndex((prev) => Math.min(CURRICULUM_SLIDES.length - 1, prev + 1));
  };

  const prevSlide = () => {
    soundFx.playClick();
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden bg-[#0A0E13] select-none">
      {/* Left Sidebar: Lesson Index Table of Contents */}
      <div className="w-full md:w-80 lg:w-96 border-r border-cyber-border bg-[#0C121A] flex flex-col shrink-0">
        <div className="p-4 border-b border-cyber-border bg-[#101824] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white font-mono">
            <GraduationCap className="w-5 h-5 text-nvidia-green" />
            <span>Giáo Trình Giảng Dạy Robot</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-nvidia-green/20 text-nvidia-green font-mono">
            6 Bài Học
          </span>
        </div>

        {/* Slide List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {CURRICULUM_SLIDES.map((s, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <button
                key={s.id}
                onClick={() => {
                  soundFx.playClick();
                  setCurrentSlideIndex(idx);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  isActive
                    ? 'border-nvidia-green bg-[#142318] text-white shadow-md'
                    : 'border-cyber-border/70 hover:border-gray-500 hover:bg-cyber-surface/60 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-nvidia-green uppercase font-bold">
                    Bài {s.id} • {s.categoryVi}
                  </span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-nvidia-green animate-pulse" />}
                </div>
                <div className="text-xs font-bold font-display line-clamp-2">{s.titleVi}</div>
                <div className="text-[11px] text-gray-400 font-mono truncate">{s.titleEn}</div>
              </button>
            );
          })}
        </div>

        {/* Teacher Mode Info Box */}
        <div className="p-3 border-t border-cyber-border bg-[#0e1520] text-xs font-mono text-gray-400 space-y-1">
          <div className="flex items-center gap-1.5 text-cyber-accent font-semibold">
            <Lightbulb className="w-4 h-4 text-cyber-accent" />
            <span>Dành cho Giáo viên STEM & Robotics</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Thiết kế theo chuẩn giáo án đại học và trường chuyên: kết hợp lý thuyết giải thuật, mô hình toán học và thực hành trực tiếp trên Jupyter Notebook.
          </p>
        </div>
      </div>

      {/* Main Slide Viewer Presentation Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 bg-[#090D13]">
        {/* Slide Content Box */}
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between cyber-panel p-6 sm:p-8 rounded-2xl border border-cyber-border shadow-2xl relative">
          <div>
            {/* Slide Header Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-4">
              <span className="text-xs font-mono font-bold text-nvidia-green uppercase tracking-wider flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-nvidia-green/15 border border-nvidia-green/30">
                  Slide {slide.id} / {CURRICULUM_SLIDES.length}
                </span>
                <span>{slide.categoryVi}</span>
              </span>
              <span className="text-xs font-mono text-gray-400 hidden sm:inline">{slide.titleEn}</span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-display mb-3">
              {slide.titleVi}
            </h1>

            {/* Summary */}
            <div className="p-3.5 rounded-xl bg-nvidia-green/10 border border-nvidia-green/30 text-emerald-200 text-xs sm:text-sm leading-relaxed mb-6">
              <span className="font-bold text-nvidia-green">Mục tiêu bài giảng: </span>
              {slide.summaryVi}
            </div>

            {/* Bullet Points */}
            <div className="space-y-3 mb-6">
              <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold font-mono">
                Nội Dung Trọng Tâm:
              </h2>
              <div className="space-y-2.5">
                {slide.bulletPointsVi.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-nvidia-green shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mathematical Formula Box (if present) */}
            {slide.formula && (
              <div className="p-4 rounded-xl bg-[#0d1622] border border-cyber-border space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-mono text-cyber-accent font-bold">
                  <Sigma className="w-4 h-4 text-cyber-accent" />
                  <span>Mô Hình Toán Học & Công Thức Vật Lý:</span>
                </div>
                <div className="p-3 rounded-lg bg-[#080d14] border border-cyber-border/70 font-mono text-xs sm:text-sm text-white overflow-x-auto text-center font-bold">
                  {slide.formula.tex}
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 italic">
                  {slide.formula.explanationVi}
                </p>
              </div>
            )}

            {/* Teacher Tips Callout */}
            <div className="p-4 rounded-xl bg-[#1a180f] border border-amber-500/40 space-y-1.5 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Gợi Ý Giảng Dạy & Thảo Luận Trên Lớp (Teacher Tips):</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-200 leading-relaxed">{slide.teacherTipsVi}</p>
            </div>
          </div>

          {/* Bottom Action Footer with Next/Prev and Jupyter Link */}
          <div className="pt-4 border-t border-cyber-border flex flex-wrap items-center justify-between gap-3">
            {/* Quick Link to corresponding Jupyter Notebook */}
            <button
              onClick={() => {
                soundFx.playExecuteCell();
                onSelectMode('jupyter');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#142318] text-nvidia-green border border-nvidia-green/40 hover:bg-nvidia-green hover:text-black transition-all"
            >
              <Code2 className="w-4 h-4" />
              <span>Mở Thực Hành Trên JupyterLab Ngay →</span>
            </button>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyber-card border border-cyber-border text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Bài Trước</span>
              </button>

              <button
                onClick={nextSlide}
                disabled={currentSlideIndex === CURRICULUM_SLIDES.length - 1}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-nvidia-green text-black hover:bg-[#86d600] disabled:opacity-30 transition-colors"
              >
                <span>Bài Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
