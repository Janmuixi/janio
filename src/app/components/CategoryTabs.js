'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { ItemList } from './ItemList';
import { ItemDetail } from './ItemDetail';
import { Plus, FileText, CheckSquare, Briefcase, Lightbulb } from 'lucide-react';

const iconMap = {
  notes: FileText,
  tasks: CheckSquare,
  work_tasks: Briefcase,
  interesting_stuff: Lightbulb,
};

function CategoryListPanel({
  category,
  Icon,
  items,
  onAdd,
  onSelect,
  onReorder,
  selectedItemId,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {category.name}
        </h2>
        <button
          onClick={() => onAdd(category.id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <ItemList
        items={items}
        onItemSelect={onSelect}
        onItemsReorder={onReorder}
        selectedItemId={selectedItemId}
        categoryId={category.id}
      />
    </div>
  );
}

function CategoryDetailPanel({
  category,
  Icon,
  selectedItem,
  onUpdate,
  onDelete,
}) {
  if (!selectedItem) {
    return (
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
    );
  }

  return (
    <ItemDetail
      item={selectedItem}
      onUpdate={onUpdate}
      onDelete={onDelete}
      categoryId={category.id}
    />
  );
}

function CategoryTabContent({
  category,
  Icon,
  items,
  selectedItem,
  onAdd,
  onSelect,
  onReorder,
  onUpdate,
  onDelete,
}) {
  return (
    <TabsContent value={category.id} className="mt-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryListPanel
          category={category}
          Icon={Icon}
          items={items}
          onAdd={onAdd}
          onSelect={onSelect}
          onReorder={onReorder}
          selectedItemId={selectedItem?.id}
        />
        <div className="lg:sticky lg:top-8">
          <CategoryDetailPanel
            category={category}
            Icon={Icon}
            selectedItem={selectedItem}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </div>
    </TabsContent>
  );
}

export function CategoryTabs({
  categories,
  activeTab,
  onTabChange,
  itemsByCategory,
  selectedItem,
  onItemSelect,
  onItemCreate,
  onItemUpdate,
  onItemDelete,
  onItemsReorder,
}) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        {categories.map((category) => {
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

      {categories.map((category) => {
        const Icon = iconMap[category.id] || FileText;
        return (
          <CategoryTabContent
            key={category.id}
            category={category}
            Icon={Icon}
            items={itemsByCategory[category.id] || []}
            selectedItem={selectedItem}
            onAdd={onItemCreate}
            onSelect={onItemSelect}
            onReorder={onItemsReorder}
            onUpdate={onItemUpdate}
            onDelete={onItemDelete}
          />
        );
      })}
    </Tabs>
  );
}
