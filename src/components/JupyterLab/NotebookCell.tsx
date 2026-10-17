import React, { useState } from 'react';
import { NotebookCell as CellType, RobotState } from '../../types/jetbot';
import { Play, Check, AlertCircle, Terminal, Copy } from 'lucide-react';
import { IpywidgetsPanel } from './IpywidgetsPanel';

interface NotebookCellProps {
  cell: CellType;
  index: number;
  robotState: RobotState;
  onRun: (cellId: string, code: string) => void;
  onUpdateSource: (cellId: string, newSource: string) => void;
}

export const NotebookCell: React.FC<NotebookCellProps> = ({
  cell,
  index,
  robotState,
  onRun,
  onUpdateSource,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(cell.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter to run cell!
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onRun(cell.id, cell.source);
    }
  };

  // Render Markdown cell
  if (cell.type === 'markdown') {
    // Simple markdown renderer for clean display
    const lines = cell.source.split('\n');
    return (
      <div className="group relative my-3 p-4 rounded-lg bg-[#0F1620]/60 border border-transparent hover:border-cyber-border transition-colors text-sm text-gray-200">
        <div className="prose prose-invert max-w-none space-y-2">
          {lines.map((line, lIdx) => {
            if (line.startsWith('# ')) {
              return (
                <h1 key={lIdx} className="text-lg sm:text-xl font-bold text-white font-display border-b border-cyber-border pb-1.5 flex items-center gap-2">
                  <span className="text-nvidia-green">#</span> {line.replace('# ', '')}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={lIdx} className="text-base sm:text-lg font-bold text-nvidia-green font-display mt-3">
                  {line.replace('## ', '')}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={lIdx} className="text-sm sm:text-base font-semibold text-cyber-accent font-display mt-2">
                  {line.replace('### ', '')}
                </h3>
              );
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <li key={lIdx} className="ml-4 list-disc text-gray-300 text-xs sm:text-sm">
                  {line.substring(2)}
                </li>
              );
            }
            if (line.trim().length === 0) {
              return <div key={lIdx} className="h-1" />;
            }
            return (
              <p key={lIdx} className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Code cell
  const lineCount = cell.source.split('\n').length;
  const promptNumber = cell.isRunning ? '*' : cell.executionCount !== null && cell.executionCount !== undefined ? cell.executionCount : ' ';

  return (
    <div className="group my-3 rounded-lg border border-cyber-border bg-[#0C121A] overflow-hidden shadow-sm hover:border-[#38516d] transition-all">
      {/* Code Input Area */}
      <div className="flex bg-[#0E1521] border-b border-cyber-border/80">
        {/* Cell Prompt Indicator [n]: */}
        <div className="w-14 sm:w-16 shrink-0 py-2.5 px-1 text-center font-mono text-[11px] text-gray-500 border-r border-cyber-border select-none flex flex-col items-center justify-start gap-1">
          <span className={`${cell.isRunning ? 'text-amber-400 font-bold animate-pulse' : 'text-nvidia-green'}`}>
            [{promptNumber}]:
          </span>
          <button
            onClick={() => onRun(cell.id, cell.source)}
            title="Chạy ô code này (Shift + Enter)"
            className="p-1 rounded bg-nvidia-green/15 text-nvidia-green hover:bg-nvidia-green hover:text-black transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>
        </div>

        {/* Code Editor Body */}
        <div className="flex-1 relative">
          <textarea
            value={cell.source}
            onChange={(e) => onUpdateSource(cell.id, e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, lineCount)}
            spellCheck={false}
            className="w-full h-full p-2.5 bg-transparent font-code text-xs text-gray-100 resize-none outline-none focus:ring-0 leading-relaxed selection:bg-nvidia-green/30"
          />

          {/* Top Right Copy Code Button */}
          <button
            onClick={handleCopy}
            title="Sao chép mã nguồn"
            className="absolute top-2 right-2 p-1 rounded text-gray-500 hover:text-white bg-cyber-card/80 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Output Area */}
      {(cell.output || cell.widgetType) && (
        <div className="flex bg-[#080C11]">
          {/* Prompt Out [n]: */}
          <div className="w-14 sm:w-16 shrink-0 py-2 px-1 text-center font-mono text-[10px] text-red-400 border-r border-cyber-border/40 select-none">
            {cell.executionCount && <span>Out [{cell.executionCount}]:</span>}
          </div>

          <div className="flex-1 p-2.5 overflow-x-auto">
            {/* Widget Output (if any) */}
            {(cell.widgetType || cell.outputWidget) && <IpywidgetsPanel type={(cell.widgetType || cell.outputWidget)!} robotState={robotState} />}

            {/* Standard Stdout / Stderr Output */}
            {cell.output && (
              <pre className="font-code text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {cell.output}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
