import { NextResponse } from 'next/server';
import { 
  getDb, 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs, 
  writeBatch, 
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const contentCollection = collection(db, 'content');
    const q = query(
      contentCollection, 
      where('type', '==', category),
      orderBy('order', 'asc')
    );
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
    const body = await request.json();
    const { action } = body || {};

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const db = getDb();
    const contentCollection = collection(db, 'content');

    if (action === 'create') {
      const { category, item } = body;
      if (!category || !item || !item.id) {
        return NextResponse.json({ error: 'Category and item with id are required' }, { status: 400 });
      }

      const docRef = doc(contentCollection, item.id);
      await setDoc(docRef, {
        type: category,
        ...item,
        createdAt: item.createdAt || new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({ success: true, id: item.id });
    }

    if (action === 'update') {
      const { category, item } = body;
      if (!category || !item || !item.id) {
        return NextResponse.json({ error: 'Category and item with id are required' }, { status: 400 });
      }

      const docRef = doc(contentCollection, item.id);
      await updateDoc(docRef, {
        ...item,
        type: category,
        updatedAt: new Date()
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
      }

      const docRef = doc(contentCollection, itemId);
      await deleteDoc(docRef);

      return NextResponse.json({ success: true });
    }

    if (action === 'reorder') {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'items array with id and order is required' }, { status: 400 });
      }

      const batch = writeBatch(db);
      items.forEach((item) => {
        if (!item.id) {
          return;
        }
        const docRef = doc(contentCollection, item.id);
        batch.update(docRef, { order: item.order });
      });

      await batch.commit();

      return NextResponse.json({ success: true, updated: items.length });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Error updating Firestore:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
