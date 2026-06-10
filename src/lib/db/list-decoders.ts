import ExcelJS from 'exceljs';
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('/Users/ed/Downloads/Kato DCC Database.xlsx');
const ws = wb.worksheets[0];
for (let i = 2; i <= ws.rowCount; i++) {
	const vals = ws.getRow(i).values as any[];
	const op = String(vals[6] ?? '').trim();
	if (op === 'JNF') console.log(`row ${i}: model=${vals[2]} proto=${vals[3]} variant=${vals[4]} operator="${op}"`);
}
