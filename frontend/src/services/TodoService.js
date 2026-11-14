import api from './api';

const TodoService = {
  getTodos: async () => {
    const response = await api.get('/todos');
    return response.data;
  },

  addTodo: async (todoData) => {
    const response = await api.post('/todos', todoData);
    return response.data;
  },

  updateTodo: async (id, todoData) => {
    const response = await api.put(`/todos/${id}`, todoData);
    return response.data;
  },

  deleteTodo: async (id) => {
    await api.delete(`/todos/${id}`);
  },

  toggleTodo: async (id) => {
    await api.patch(`/todos/${id}/toggle`);
  },
};

export default TodoService;
