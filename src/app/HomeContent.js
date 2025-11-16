'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { ItemList } from './components/ItemList';
import { ItemDetail } from './components/ItemDetail';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Plus, FileText, CheckSquare, Briefcase, Lightbulb } from 'lucide-react';
import { categories as categoryMeta, taskCategoryIds } from '@/lib/categories';

const iconMap = {
  notes: FileText,
  tasks: CheckSquare,
  work_tasks: Briefcase,
  interesting_stuff: Lightbulb
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('notes');
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize active tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && categoryMeta.some(cat => cat.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load data from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedItems = {};
        for (const category of categoryMeta) {
          const response = await fetch(`/api/content?category=${category.id}`);
          if (response.ok) {
            loadedItems[category.id] = await response.json();
          } else {
            loadedItems[category.id] = [];
          }
        }
        setItems(loadedItems);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty arrays
        const emptyItems = {};
        categoryMeta.forEach(cat => {
          emptyItems[cat.id] = [];
        });
        setItems(emptyItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle tab change with URL update
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSelectedItem(null); // Clear selected item when switching tabs
    
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'notes') {
      params.delete('tab'); // Remove tab param for default tab
    } else {
      params.set('tab', newTab);
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
  };

  const generateItemId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString();
  };

  const mutateContent = async (payload) => {
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
      // You could add a toast notification here
      throw error;
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const handleItemUpdate = (updatedItem, categoryId = activeTab) => {
    const targetItems = items[categoryId] || [];
    const updatedItems = targetItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    
    setItems(prev => ({
      ...prev,
      [categoryId]: updatedItems
    }));
    if (categoryId === activeTab) {
      setSelectedItem(updatedItem);
    }
    
    mutateContent({
      action: 'update',
      category: categoryId,
      item: updatedItem
    }).catch(() => {
      // Consider reverting state or showing an error toast
    });
  };

  const handleItemCreate = (categoryId, partialItem = {}) => {
    const categoryItems = items[categoryId] || [];
    const itemWithId = {
      title: '',
      description: '',
      order: categoryItems.length + 1,
      ...partialItem,
    };

    if (!itemWithId.id) {
      itemWithId.id = generateItemId();
    }

    if (taskCategoryIds.has(categoryId) && typeof itemWithId.dueDate === 'undefined') {
      itemWithId.dueDate = '';
    }
    
    const updatedItems = [...categoryItems, itemWithId];
    
    setItems(prev => ({
      ...prev,
      [categoryId]: updatedItems
    }));
    if (categoryId === activeTab) {
      setSelectedItem(itemWithId);
    }
    
    mutateContent({
      action: 'create',
      category: categoryId,
      item: itemWithId
    }).catch(() => {
      // Consider reverting state or showing an error toast
    });
  };

  const handleItemDelete = (itemId, categoryId = activeTab) => {
    const targetItems = items[categoryId] || [];
    const updatedItems = targetItems.filter(item => item.id !== itemId);
    
    setItems(prev => ({
      ...prev,
      [categoryId]: updatedItems
    }));
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
    
    mutateContent({
      action: 'delete',
      category: categoryId,
      itemId
    }).catch(() => {
      // Consider reverting state or showing an error toast
    });
  };

  const handleItemsReorder = (reorderedItems, categoryId = activeTab) => {
    setItems(prev => ({
      ...prev,
      [categoryId]: reorderedItems
    }));
    
    mutateContent({
      action: 'reorder',
      category: categoryId,
      items: reorderedItems.map(({ id, order }) => ({ id, order }))
    }).catch(() => {
      // Consider reverting state or showing an error toast
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your life organizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jan.io</h1>
          <p className="text-gray-600">Organize your life, one item at a time</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {categoryMeta.map((category) => {
              const Icon = iconMap[category.id] || FileText;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categoryMeta.map((category) => {
            const Icon = iconMap[category.id] || FileText;
            return (
              <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {category.name}
                    </h2>
                    <button
                      onClick={() => handleItemCreate(category.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>
                  
                  <ItemList
                    items={items[category.id] || []}
                    onItemSelect={handleItemSelect}
                    onItemsReorder={handleItemsReorder}
                    selectedItemId={selectedItem?.id}
                    categoryId={category.id}
                  />
                </div>

                <div className="lg:sticky lg:top-8">
                  {selectedItem ? (
                    <ItemDetail
                      item={selectedItem}
                      onUpdate={handleItemUpdate}
                      onDelete={handleItemDelete}
                      categoryId={category.id}
                    />
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <Icon className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select an item to view details
                      </h3>
                      <p className="text-gray-500">
                        Choose an item from the list to see its details and edit it.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}
