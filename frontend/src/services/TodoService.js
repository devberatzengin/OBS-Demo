import api from './api';

const TodoService = {
  getTodos: async () => {
    console.log('Fetching todos...');
    const response = await api.get('/todos');
    console.log('Todos received:', response.data);
    return response.data;
  },

  addTodo: async (todoData) => {
    console.log('Adding todo:', todoData);
    const response = await api.post('/todos', todoData);
    console.log('Todo added response:', response.data);
    return response.data;
  },

  updateTodo: async (id, todoData) => {
    console.log('Updating todo:', id, todoData);
    const response = await api.put(`/todos/${id}`, todoData);
    return response.data;
  },

  deleteTodo: async (id) => {
    console.log('Deleting todo:', id);
    await api.delete(`/todos/${id}`);
  },

  toggleTodo: async (id) => {
    console.log('Toggling todo:', id);
    await api.patch(`/todos/${id}/toggle`);
  }
};

export default TodoService;
