import { NextResponse } from 'next/server';
import { getDb, collection, query, where, getDocs, writeBatch, addDoc, doc } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const contentCollection = collection(db, 'content');
    const q = query(contentCollection, where('type', '==', category));
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamps to JavaScript Date objects
      if (data.dueDate && data.dueDate.toDate) {
        data.dueDate = data.dueDate.toDate();
      }
      items.push({ id: doc.id, ...data });
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading from Firestore:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { category, items } = await request.json();

    if (!category || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Category and items array are required' }, { status: 400 });
    }

    const db = getDb();
    const contentCollection = collection(db, 'content');
    
    // First, find all existing documents with the specified type
    const q = query(contentCollection, where('type', '==', category));
    const querySnapshot = await getDocs(q);
    
    // Create a batch operation
    const batch = writeBatch(db);
    
    // Delete all existing documents for this category
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Add all new items as individual documents
    items.forEach((item) => {
      const docRef = doc(contentCollection);
      batch.set(docRef, {
        type: category,
        ...item,
        createdAt: new Date()
      });
    });
    
    // Commit the batch operation
    await batch.commit();
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: querySnapshot.size,
      createdCount: items.length 
    });
  } catch (error) {
    console.error('Error updating Firestore:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
