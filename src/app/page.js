'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { ItemList } from './components/ItemList';
import { ItemDetail } from './components/ItemDetail';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Plus, FileText, CheckSquare, Briefcase, Lightbulb } from 'lucide-react';

const categories = [
  { id: 'notes', name: 'Notes', icon: FileText, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'tasks', name: 'Tasks', icon: CheckSquare, color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'work_tasks', name: 'Work Tasks', icon: Briefcase, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'interesting_stuff', name: 'Interesting Stuff', icon: Lightbulb, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('notes');
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load data from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedItems = {};
        for (const category of categories) {
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
        categories.forEach(cat => {
          emptyItems[cat.id] = [];
        });
        setItems(emptyItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to API
  const saveData = async (category, itemsToSave) => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          items: itemsToSave
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      // You could add a toast notification here
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const handleItemUpdate = (updatedItem) => {
    const updatedItems = items[activeTab].map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    
    setItems(prev => ({
      ...prev,
      [activeTab]: updatedItems
    }));
    setSelectedItem(updatedItem);
    
    // Save to API
    saveData(activeTab, updatedItems);
  };

  const handleItemCreate = (newItem) => {
    const itemWithId = {
      ...newItem,
      id: Date.now().toString(),
      order: items[activeTab].length + 1
    };
    
    const updatedItems = [...items[activeTab], itemWithId];
    
    setItems(prev => ({
      ...prev,
      [activeTab]: updatedItems
    }));
    setSelectedItem(itemWithId);
    
    // Save to API
    saveData(activeTab, updatedItems);
  };

  const handleItemDelete = (itemId) => {
    const updatedItems = items[activeTab].filter(item => item.id !== itemId);
    
    setItems(prev => ({
      ...prev,
      [activeTab]: updatedItems
    }));
    setSelectedItem(null);
    
    // Save to API
    saveData(activeTab, updatedItems);
  };

  const handleItemsReorder = (reorderedItems) => {
    setItems(prev => ({
      ...prev,
      [activeTab]: reorderedItems
    }));
    
    // Save to API
    saveData(activeTab, reorderedItems);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
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

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <category.icon className="h-5 w-5" />
                      {category.name}
                    </h2>
                    <button
                      onClick={() => handleItemCreate({ title: '', description: '', order: items[category.id].length + 1 })}
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
                        <category.icon className="h-12 w-12 mx-auto" />
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
          ))}
        </Tabs>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}
