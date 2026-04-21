import { NextResponse } from 'next/server';

// Mock data for statement ledger
const mockLedger = [
  { id: 1, srNo: 1, date: '2024-01-15 14:32:00', credit: 5000, debit: 0, balance: 15000, sport: 'Cricket', remark: 'Deposit' },
  { id: 2, srNo: 2, date: '2024-01-15 15:10:00', credit: 0, debit: 1000, balance: 14000, sport: 'Cricket', remark: 'Bet on India vs Australia' },
  { id: 3, srNo: 3, date: '2024-01-15 16:45:00', credit: 2500, debit: 0, balance: 16500, sport: 'Football', remark: 'Bet Won - Manchester United' },
  { id: 4, srNo: 4, date: '2024-01-15 18:20:00', credit: 0, debit: 500, balance: 16000, sport: 'Tennis', remark: 'Bet on Djokovic' },
  { id: 5, srNo: 5, date: '2024-01-16 10:00:00', credit: 0, debit: 2000, balance: 14000, sport: 'Cricket', remark: 'Bet on IPL Match' },
  { id: 6, srNo: 6, date: '2024-01-16 12:30:00', credit: 4000, debit: 0, balance: 18000, sport: 'Football', remark: 'Bet Won - Liverpool' },
  { id: 7, srNo: 7, date: '2024-01-16 14:15:00', credit: 0, debit: 1500, balance: 16500, sport: 'Basketball', remark: 'Bet on NBA' },
  { id: 8, srNo: 8, date: '2024-01-17 09:00:00', credit: 3000, debit: 0, balance: 19500, sport: 'Cricket', remark: 'Deposit' },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const filterType = searchParams.get('filterType') || 'all';
  const sport = searchParams.get('sport');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  let filteredData = [...mockLedger];

  // Apply date filter
  if (fromDate) {
    filteredData = filteredData.filter(item => new Date(item.date) >= new Date(fromDate));
  }
  if (toDate) {
    filteredData = filteredData.filter(item => new Date(item.date) <= new Date(toDate));
  }

  // Apply type filter
  if (filterType === 'credit') {
    filteredData = filteredData.filter(item => item.credit > 0);
  } else if (filterType === 'debit') {
    filteredData = filteredData.filter(item => item.debit > 0);
  }

  // Apply sport filter
  if (sport && sport !== 'all') {
    filteredData = filteredData.filter(item => item.sport.toLowerCase() === sport.toLowerCase());
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit),
    },
  });
}