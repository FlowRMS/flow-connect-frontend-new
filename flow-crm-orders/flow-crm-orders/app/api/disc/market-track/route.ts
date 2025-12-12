import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureDbInitialized } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    ensureDbInitialized();
    const db = getDb();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortDir = searchParams.get('sortDir') || 'asc';
    const section = searchParams.get('section');
    const category = searchParams.get('category');
    const year = searchParams.get('year');

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (section) {
      conditions.push('section = ?');
      params.push(section);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (year) {
      conditions.push('year = ?');
      params.push(parseInt(year));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to prevent SQL injection
    const validColumns = ['id', 'section', 'description', 'location', 'fips_code', 'category', 'year', 'value'];
    const safeSort = validColumns.includes(sortBy) ? sortBy : 'id';
    const safeSortDir = sortDir === 'desc' ? 'DESC' : 'ASC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM market_track ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };

    // Get paginated data
    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT id, section, description, location, fips_code, category, year, value
      FROM market_track
      ${whereClause}
      ORDER BY ${safeSort} ${safeSortDir}
      LIMIT ? OFFSET ?
    `;
    const data = db.prepare(dataQuery).all(...params, pageSize, offset);

    // Get filter options
    const sections = db.prepare('SELECT DISTINCT section FROM market_track ORDER BY section').all() as { section: string }[];
    const categories = db.prepare('SELECT DISTINCT category FROM market_track ORDER BY category').all() as { category: string }[];
    const years = db.prepare('SELECT DISTINCT year FROM market_track ORDER BY year').all() as { year: number }[];

    return NextResponse.json({
      data,
      total: countResult.total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult.total / pageSize),
      filters: {
        sections: sections.map(s => s.section),
        categories: categories.map(c => c.category),
        years: years.map(y => y.year),
      },
    });
  } catch (error) {
    console.error('Market track API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
