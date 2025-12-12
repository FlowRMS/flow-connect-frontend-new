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
    const state = searchParams.get('state');
    const category = searchParams.get('category');
    const year = searchParams.get('year');

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (state) {
      conditions.push('state = ?');
      params.push(state);
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
    const validColumns = ['id', 'state', 'county', 'fips_code', 'category', 'year', 'value'];
    const safeSort = validColumns.includes(sortBy) ? sortBy : 'id';
    const safeSortDir = sortDir === 'desc' ? 'DESC' : 'ASC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM data_search ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };

    // Get paginated data
    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT id, state, county, fips_code, category, year, value
      FROM data_search
      ${whereClause}
      ORDER BY ${safeSort} ${safeSortDir}
      LIMIT ? OFFSET ?
    `;
    const data = db.prepare(dataQuery).all(...params, pageSize, offset);

    // Get filter options
    const states = db.prepare('SELECT DISTINCT state FROM data_search ORDER BY state').all() as { state: string }[];
    const categories = db.prepare('SELECT DISTINCT category FROM data_search ORDER BY category').all() as { category: string }[];
    const years = db.prepare('SELECT DISTINCT year FROM data_search ORDER BY year').all() as { year: number }[];

    return NextResponse.json({
      data,
      total: countResult.total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult.total / pageSize),
      filters: {
        states: states.map(s => s.state),
        categories: categories.map(c => c.category),
        years: years.map(y => y.year),
      },
    });
  } catch (error) {
    console.error('Data search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
