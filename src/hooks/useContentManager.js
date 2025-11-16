'use client';

import { useState, useEffect, useCallback } from 'react';
import { taskCategoryIds } from '@/lib/categories';
import { useToast } from '@/app/components/ui/ToastContext';

const FALLBACK_TAB = 'notes';
const DEFAULT_TITLE = 'Untitled item';

const normalizeTitle = (title) => {
  if (typeof title !== 'string') {
    return DEFAULT_TITLE;
  }
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_TITLE;
};

export function useContentManager({ categories = [], defaultTab = FALLBACK_TAB } = {}) {
  const initialTab = defaultTab || categories[0]?.id || FALLBACK_TAB;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const results = await Promise.all(
          categories.map(async (category) => {
            try {
              const response = await fetch(`/api/content?category=${category.id}`);
              if (!response.ok) {
                throw new Error(`Failed to fetch ${category.id}`);
              }
              const data = await response.json();
              return [category.id, data];
            } catch (error) {
              console.error(`Error loading ${category.id}:`, error);
              return [category.id, []];
            }
          })
        );

        const loadedItems = results.reduce((acc, [categoryId, data]) => {
          acc[categoryId] = data;
          return acc;
        }, {});

        setItems(loadedItems);
      } catch (error) {
        console.error('Error loading data:', error);
        const emptyItems = {};
        categories.forEach(cat => {
          emptyItems[cat.id] = [];
        });
        setItems(emptyItems);
        addToast({
          title: 'Failed to load data',
          description: 'Please check your connection and try again.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (categories.length > 0) {
      loadData();
    }
  }, [categories, addToast]);

  const mutateContent = useCallback(async (payload) => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      return response.json();
    } catch (error) {
      console.error('Error saving data:', error);
      addToast({
        title: 'Failed to save changes',
        description: 'Please try again. Your local changes may be out of sync.',
        type: 'error',
      });
      throw error;
    }
  }, [addToast]);

  const resetSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const selectItem = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const createItem = useCallback((categoryId, partialItem = {}) => {
    let createdItem = null;
    setItems(prev => {
      const categoryItems = prev[categoryId] || [];
      const itemWithId = {
        title: DEFAULT_TITLE,
        description: '',
        order: categoryItems.length + 1,
        ...partialItem,
      };

      if (!itemWithId.id) {
        itemWithId.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Date.now().toString();
      }

      itemWithId.title = normalizeTitle(itemWithId.title);

      if (taskCategoryIds.has(categoryId) && typeof itemWithId.dueDate === 'undefined') {
        itemWithId.dueDate = '';
      }

      createdItem = itemWithId;
      return {
        ...prev,
        [categoryId]: [...categoryItems, itemWithId],
      };
    });

    if (categoryId === activeTab && createdItem) {
      setSelectedItem(createdItem);
    }

    if (createdItem) {
      createdItem.title = normalizeTitle(createdItem.title);
      mutateContent({
        action: 'create',
        category: categoryId,
        item: createdItem,
      }).catch(() => {});
    }
  }, [activeTab, mutateContent]);

  const updateItem = useCallback((updatedItem, categoryId = activeTab) => {
    setItems(prev => {
      const targetItems = prev[categoryId] || [];
      const updatedItems = targetItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );
      return {
        ...prev,
        [categoryId]: updatedItems,
      };
    });

    if (categoryId === activeTab) {
      setSelectedItem(updatedItem);
    }

    const payload = {
      ...updatedItem,
      title: normalizeTitle(updatedItem.title),
    };

    mutateContent({
      action: 'update',
      category: categoryId,
      item: payload,
    }).catch(() => {});
  }, [activeTab, mutateContent]);

  const deleteItem = useCallback((itemId, categoryId = activeTab) => {
    setItems(prev => {
      const targetItems = prev[categoryId] || [];
      const updatedItems = targetItems.filter(item => item.id !== itemId);
      return {
        ...prev,
        [categoryId]: updatedItems,
      };
    });

    setSelectedItem(current => (current?.id === itemId ? null : current));

    mutateContent({
      action: 'delete',
      category: categoryId,
      itemId,
    }).catch(() => {});
  }, [activeTab, mutateContent]);

  const reorderItems = useCallback((reorderedItems, categoryId = activeTab) => {
    setItems(prev => ({
      ...prev,
      [categoryId]: reorderedItems,
    }));

    mutateContent({
      action: 'reorder',
      category: categoryId,
      items: reorderedItems.map(({ id, order }) => ({ id, order })),
    }).catch(() => {});
  }, [activeTab, mutateContent]);

  return {
    activeTab,
    setActiveTab,
    selectedItem,
    selectItem,
    resetSelection,
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}
