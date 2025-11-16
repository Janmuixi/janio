'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Calendar, X } from 'lucide-react';

export function ItemDetail({ item, onUpdate, onDelete, categoryId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  useEffect(() => {
    setEditedItem(item);
    setIsEditing(false);
  }, [item]);

  const handleSave = () => {
    onUpdate(editedItem, categoryId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id, categoryId);
    }
  };

  const isTaskCategory = categoryId === 'tasks' || categoryId === 'work_tasks';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Item' : 'Item Details'}
          </h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedItem.title}
                onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter title..."
              />
            ) : (
              <p className="text-lg font-medium text-gray-900">
                {item.title || 'Untitled'}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editedItem.description}
                onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                placeholder="Enter description..."
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {item.description || 'No description'}
              </p>
            )}
          </div>

          {/* Due Date (for tasks) */}
          {isTaskCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedItem.dueDate || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              ) : (
                <p className="text-gray-700">
                  {item.dueDate 
                    ? new Date(item.dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'No due date set'
                  }
                </p>
              )}
            </div>
          )}

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedItem.order}
                onChange={(e) => setEditedItem({ ...editedItem, order: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            ) : (
              <p className="text-gray-700">
                Position {item.order} in the list
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 space-y-1">
              <p>ID: {item.id}</p>
              <p>Category: {categoryId.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
