export const categories = [
  { id: 'notes', name: 'Notes' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'work_tasks', name: 'Work Tasks' },
  { id: 'interesting_stuff', name: 'Interesting Stuff' },
];

export const taskCategoryIds = new Set(['tasks', 'work_tasks']);

export const categoryById = categories.reduce((acc, category) => {
  acc[category.id] = category;
  return acc;
}, {});
