import type { OcrContentBlock } from './ocr-content-data';
import { displayOcrText } from './ocr-content-data';

export default function OcrContent({
    content,
    text = '',
    fill = false,
}: {
    content?: OcrContentBlock[];
    text?: string;
    fill?: boolean;
}) {
    return (content ?? [{ type: 'text', text }]).map((block, index) =>
        block.type === 'text' ? (
            <span key={index} className="whitespace-pre-wrap">
                {displayOcrText(block.text)}
            </span>
        ) : (
            <table
                key={index}
                aria-label="Recognized table"
                style={{
                    fontSize: 'inherit',
                    tableLayout: fill ? 'fixed' : 'auto',
                    height: fill && content?.length === 1 ? '100%' : undefined,
                }}
                className="w-full border-collapse font-sans leading-[1.15] text-inherit"
            >
                <tbody>
                    {block.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => {
                                const Cell = cell.header ? 'th' : 'td';
                                return (
                                    <Cell
                                        key={cellIndex}
                                        rowSpan={cell.rowSpan}
                                        colSpan={cell.colSpan}
                                        style={{ overflowWrap: 'normal' }}
                                        className="border border-slate-400 p-[0.15em] text-left align-top whitespace-pre-wrap"
                                    >
                                        {displayOcrText(cell.text)}
                                    </Cell>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        ),
    );
}
