import React, { useState } from 'react';

export interface ExcelSheetViewProps {
  activeFormula?: string;
  hasTotalRow?: boolean;
  isTableFormatted?: boolean;
  conditionalFormatted?: boolean;
}

interface CellData {
  id: string;
  val: string;
  isFormula?: boolean;
  isHeader?: boolean;
}

export const ExcelSheetView: React.FC<ExcelSheetViewProps> = ({
  activeFormula = '=SUM(D2:D10)',
  hasTotalRow = false,
  isTableFormatted = false,
  conditionalFormatted = false,
}) => {
  // Active cell coordinate
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string }>({ row: 2, col: 'D' });
  const [formulaInput, setFormulaInput] = useState(activeFormula);

  // Column letters
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  // Realistic Student Scores Data
  const initialData: Record<string, string> = {
    'A1': 'STT',
    'B1': 'Mã Học Viên',
    'C1': 'Họ và Tên',
    'D1': 'Điểm Word',
    'E1': 'Điểm Excel',
    'F1': 'Điểm TB',
    'G1': 'Kết Quả',

    'A2': '1', 'B2': 'HV-1029', 'C2': 'Nguyễn Văn An', 'D2': '850', 'E2': '920', 'F2': '885', 'G2': 'Đạt (Pass)',
    'A3': '2', 'B3': 'HV-1030', 'C3': 'Trần Thị Bích', 'D3': '720', 'E3': '810', 'F3': '765', 'G3': 'Đạt (Pass)',
    'A4': '3', 'B4': 'HV-1031', 'C4': 'Lê Hoàng Nam', 'D4': '950', 'E4': '980', 'F4': '965', 'G4': 'Đạt (Pass)',
    'A5': '4', 'B5': 'HV-1032', 'C5': 'Phạm Minh Đức', 'D5': '680', 'E5': '750', 'F5': '715', 'G5': 'Đạt (Pass)',
    'A6': '5', 'B6': 'HV-1033', 'C6': 'Võ Khánh Linh', 'D6': '890', 'E6': '900', 'F6': '895', 'G6': 'Đạt (Pass)',
    'A7': '6', 'B7': 'HV-1034', 'C7': 'Đặng Quốc Huy', 'D7': '760', 'E7': '780', 'F7': '770', 'G7': 'Đạt (Pass)',
    'A8': '7', 'B8': 'HV-1035', 'C8': 'Hoàng Mỹ Duyên', 'D8': '910', 'E8': '940', 'F8': '925', 'G8': 'Đạt (Pass)',
    'A9': '8', 'B9': 'HV-1036', 'C9': 'Bùi Tuấn Kiệt', 'D9': '620', 'E9': '690', 'F9': '655', 'G9': 'Thi Lại',
    'A10': '9', 'B10': 'HV-1037', 'C10': 'Đỗ Phương Thảo', 'D10': '980', 'E10': '1000', 'F10': '990', 'G10': 'Đạt (Pass)',
  };

  const getCellKey = (col: string, row: number) => `${col}${row}`;

  const handleCellClick = (col: string, row: number) => {
    setSelectedCell({ col, row });
    const key = getCellKey(col, row);
    setFormulaInput(initialData[key] || '');
  };

  return (
    <div className="w-full bg-[#f3f4f6] p-3 sm:p-6 flex flex-col items-center overflow-auto select-none font-sans text-xs">
      <div className="w-full max-w-[840px] bg-white border border-slate-300 rounded-sm shadow-xl overflow-hidden">
        {/* Real Excel Formula Bar */}
        <div className="bg-[#f9fafb] border-b border-slate-300 px-3 py-1 flex items-center gap-2 text-xs">
          {/* Name Box */}
          <div className="border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 w-16 text-center rounded-xs shadow-2xs">
            {selectedCell.col}{selectedCell.row}
          </div>

          {/* Formula Icons */}
          <div className="flex items-center gap-1 text-slate-400 font-bold px-1 border-r border-slate-200">
            <span className="cursor-pointer hover:text-slate-600 text-xs">✕</span>
            <span className="cursor-pointer hover:text-emerald-600 text-xs">✓</span>
          </div>

          <span className="font-serif italic font-bold text-slate-500 text-sm px-1">fx</span>

          {/* Formula Input */}
          <input
            type="text"
            value={formulaInput}
            onChange={e => setFormulaInput(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xs px-2 py-0.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-[#107c41]"
            placeholder="=SUM(D2:D10)"
          />
        </div>

        {/* Real Excel Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            {/* Column Letter Headers */}
            <thead>
              <tr className="bg-[#e9ecef] text-slate-600 font-semibold select-none">
                <th className="border border-slate-300 w-9 bg-[#dadfe4] text-center text-[10px]">◢</th>
                {columns.map(col => (
                  <th
                    key={col}
                    className={`border border-slate-300 px-2 py-1 text-center font-bold text-[11px] transition-colors ${
                      selectedCell.col === col ? 'bg-[#c6efce] text-[#006100]' : 'hover:bg-slate-200'
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Row Number Headers and Cells */}
            <tbody>
              {Array.from({ length: 11 }, (_, idx) => idx + 1).map(row => (
                <tr key={row} className="hover:bg-slate-50/50 transition-colors">
                  {/* Row Number */}
                  <td
                    className={`border border-slate-300 text-center text-[10px] font-bold bg-[#e9ecef] text-slate-600 select-none ${
                      selectedCell.row === row ? 'bg-[#c6efce] text-[#006100]' : ''
                    }`}
                  >
                    {row}
                  </td>

                  {/* Data Cells */}
                  {columns.map(col => {
                    const key = getCellKey(col, row);
                    const val = initialData[key] || '';
                    const isSelected = selectedCell.col === col && selectedCell.row === row;
                    const isHeaderRow = row === 1;

                    // Conditional formatting mock (>800 highlight green)
                    const isScoreCol = (col === 'D' || col === 'E' || col === 'F') && !isHeaderRow;
                    const numVal = parseInt(val, 10);
                    const isHigh = conditionalFormatted && isScoreCol && numVal >= 850;

                    return (
                      <td
                        key={col}
                        onClick={() => handleCellClick(col, row)}
                        className={`border border-slate-200 px-2 py-1.5 relative cursor-cell text-left transition-all ${
                          isHeaderRow
                            ? isTableFormatted
                              ? 'bg-[#107c41] text-white font-bold'
                              : 'bg-slate-100 font-bold text-slate-800'
                            : isHigh
                            ? 'bg-[#c6efce] text-[#006100] font-bold'
                            : 'bg-white text-slate-800'
                        } ${
                          isSelected
                            ? 'ring-2 ring-[#107c41] ring-inset bg-emerald-50/30 font-semibold'
                            : ''
                        }`}
                      >
                        <span>{val}</span>

                        {/* Fill Handle on Active Cell */}
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#107c41] pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Total Row if enabled */}
              {hasTotalRow && (
                <tr className="bg-emerald-50 font-bold text-[#107c41] border-t-2 border-emerald-600">
                  <td className="border border-slate-300 text-center text-[10px] bg-[#dadfe4]">12</td>
                  <td className="border border-slate-300 px-2 py-1" colSpan={3}>Tổng Cộng (Total)</td>
                  <td className="border border-slate-300 px-2 py-1">∑ 7,460</td>
                  <td className="border border-slate-300 px-2 py-1">∑ 7,870</td>
                  <td className="border border-slate-300 px-2 py-1">ĐTB: 840</td>
                  <td className="border border-slate-300 px-2 py-1">9 Đạt / 1 Rớt</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Real Excel Sheet Tabs at Bottom */}
        <div className="bg-[#f3f4f6] border-t border-slate-300 px-2 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button className="bg-white text-[#107c41] font-bold px-3 py-1 rounded-t border-t-2 border-[#107c41] border-x border-slate-300 text-[11px] shadow-2xs">
              Sheet1
            </button>
            <button className="text-slate-600 hover:bg-slate-200 px-3 py-1 rounded-t text-[11px]">
              Báo Cáo Tổng Hợp
            </button>
            <button className="text-slate-500 hover:bg-slate-200 px-2 py-0.5 rounded text-xs font-bold" title="Thêm Sheet Mới">
              +
            </button>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>Sẵn Sàng (Ready)</span>
            <span>•</span>
            <span>Trung Bình: 840</span>
            <span>•</span>
            <span>Đếm: 9</span>
            <span>•</span>
            <span>100% Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
