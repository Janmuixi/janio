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
import { categories } from '@/lib/categories';

const validCategoryIds = new Set(categories.map((cat) => cat.id));

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidDueDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const normalizeOrder = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return null;
  }
  return Math.floor(numeric);
};

const validateItemPayload = (item) => {
  if (!item || typeof item !== 'object') {
    return 'Item payload must be an object';
  }

  if (!isNonEmptyString(item.id)) {
    return 'Item id is required';
  }

  if (!isNonEmptyString(item.title || '')) {
    return 'Title must be a non-empty string';
  }

  const normalizedOrder = normalizeOrder(item.order);
  if (normalizedOrder === null) {
    return 'Order must be a positive number';
  }
  item.order = normalizedOrder;

  if (item.description !== undefined && typeof item.description !== 'string') {
    return 'Description must be a string';
  }

  if (!isValidDueDate(item.dueDate)) {
    return 'dueDate must be a valid date string';
  }

  return null;
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }
  if (!validCategoryIds.has(category)) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
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
      if (!category || !validCategoryIds.has(category)) {
        return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
      }

      const validationError = validateItemPayload(item);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
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
      if (!category || !validCategoryIds.has(category)) {
        return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
      }

      const validationError = validateItemPayload(item);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
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
      const { category, itemId } = body;
      if (!category || !validCategoryIds.has(category)) {
        return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
      }
      if (!itemId) {
        return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
      }

      const docRef = doc(contentCollection, itemId);
      await deleteDoc(docRef);

      return NextResponse.json({ success: true });
    }

    if (action === 'reorder') {
      const { category, items } = body;
      if (!category || !validCategoryIds.has(category)) {
        return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'items array with id and order is required' }, { status: 400 });
      }

      const normalizedEntries = [];
      for (const item of items) {
        if (!item?.id) {
          return NextResponse.json({ error: 'Each item must include an id' }, { status: 400 });
        }
        const normalizedOrder = normalizeOrder(item.order);
        if (normalizedOrder === null) {
          return NextResponse.json({ error: 'Order must be a positive number' }, { status: 400 });
        }
        normalizedEntries.push({ id: item.id, order: normalizedOrder });
      }

      const batch = writeBatch(db);
      normalizedEntries.forEach(({ id, order }) => {
        const docRef = doc(contentCollection, id);
        batch.update(docRef, { order });
      });

      await batch.commit();

      return NextResponse.json({ success: true, updated: normalizedEntries.length });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Error updating Firestore:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
