import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'public', 'content');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  try {
    const filePath = path.join(contentDir, `${category}.json`);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const items = JSON.parse(data);
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { category, items } = await request.json();

    if (!category || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Category and items array are required' }, { status: 400 });
    }

    const filePath = path.join(contentDir, `${category}.json`);
    
    // Ensure directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Write data to file
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing file:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
