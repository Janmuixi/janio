'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryTabs } from './components/CategoryTabs';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { categories as categoryMeta } from '@/lib/categories';
import { useContentManager } from '@/hooks/useContentManager';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
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
  } = useContentManager({ categories: categoryMeta, defaultTab: 'notes' });

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && categoryMeta.some(cat => cat.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
      resetSelection();
    }
  }, [searchParams, setActiveTab, resetSelection]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    resetSelection();
    
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'notes') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl, { scroll: false });
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

        <CategoryTabs
          categories={categoryMeta}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          itemsByCategory={items}
          selectedItem={selectedItem}
          onItemSelect={selectItem}
          onItemCreate={createItem}
          onItemUpdate={updateItem}
          onItemDelete={deleteItem}
          onItemsReorder={reorderItems}
        />
      </div>
      <PWAInstallPrompt />
    </div>
  );
}
