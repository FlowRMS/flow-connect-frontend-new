import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureDbInitialized } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    ensureDbInitialized();
    const db = getDb();

    const searchParams = request.nextUrl.searchParams;
    const rows = searchParams.get('rows')?.split(',').filter(Boolean) || [];
    const columns = searchParams.get('columns')?.split(',').filter(Boolean) || [];
    const values = searchParams.get('values')?.split(',').filter(Boolean) || [];
    const section = searchParams.get('section');
    const category = searchParams.get('category');
    const year = searchParams.get('year');

    // Get available fields for the pivot configuration
    const availableFields = [
      { key: 'section', label: 'Section', type: 'dimension' },
      { key: 'description', label: 'Description', type: 'dimension' },
      { key: 'location', label: 'Location', type: 'dimension' },
      { key: 'category', label: 'Category', type: 'dimension' },
      { key: 'year', label: 'Year', type: 'dimension' },
      { key: 'value', label: 'Value', type: 'measure' },
    ];

    // If no rows selected, return just the available fields and filter options
    if (rows.length === 0) {
      const sections = db.prepare('SELECT DISTINCT section FROM market_track ORDER BY section').all() as { section: string }[];
      const categories = db.prepare('SELECT DISTINCT category FROM market_track ORDER BY category').all() as { category: string }[];
      const years = db.prepare('SELECT DISTINCT year FROM market_track ORDER BY year').all() as { year: number }[];

      return NextResponse.json({
        availableFields,
        data: [],
        columnValues: [],
        filters: {
          sections: sections.map(s => s.section),
          categories: categories.map(c => c.category),
          years: years.map(y => y.year),
        },
      });
    }

    // Build WHERE clause for filters
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

    // Validate columns to prevent SQL injection
    const validColumns = ['section', 'description', 'location', 'fips_code', 'category', 'year', 'value'];
    const safeRows = rows.filter(r => validColumns.includes(r));
    const safeColumns = columns.filter(c => validColumns.includes(c));
    const safeValues = values.filter(v => validColumns.includes(v));

    // Get unique column values if column is selected
    let columnValues: string[] = [];
    if (safeColumns.length > 0) {
      const colQuery = `SELECT DISTINCT ${safeColumns[0]} as col FROM market_track ${whereClause} ORDER BY ${safeColumns[0]} LIMIT 10`;
      const colResults = db.prepare(colQuery).all(...params) as { col: string | number }[];
      columnValues = colResults.map(r => String(r.col));
    }

    // Build the pivot query
    let selectParts = safeRows.map(r => r);

    if (safeColumns.length > 0 && safeValues.length > 0) {
      // Create pivot columns
      for (const colVal of columnValues) {
        selectParts.push(
          `SUM(CASE WHEN ${safeColumns[0]} = '${colVal}' THEN ${safeValues[0]} ELSE 0 END) as "${colVal}"`
        );
      }
    } else if (safeValues.length > 0) {
      selectParts.push(`SUM(${safeValues[0]}) as total_value`);
    }

    const groupBy = safeRows.join(', ');
    const pivotQuery = `
      SELECT ${selectParts.join(', ')}
      FROM market_track
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY ${safeRows[0]}
      LIMIT 500
    `;

    const data = db.prepare(pivotQuery).all(...params);

    // Get filter options
    const sections = db.prepare('SELECT DISTINCT section FROM market_track ORDER BY section').all() as { section: string }[];
    const categories = db.prepare('SELECT DISTINCT category FROM market_track ORDER BY category').all() as { category: string }[];
    const years = db.prepare('SELECT DISTINCT year FROM market_track ORDER BY year').all() as { year: number }[];

    return NextResponse.json({
      availableFields,
      data,
      columnValues,
      filters: {
        sections: sections.map(s => s.section),
        categories: categories.map(c => c.category),
        years: years.map(y => y.year),
      },
    });
  } catch (error) {
    console.error('Market track pivot API error:', error);
    return NextResponse.json({ error: 'Failed to fetch pivot data' }, { status: 500 });
  }
}
