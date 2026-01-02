import { CommonModule } from '@angular/common';
import { Component, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { storage } from '~/core/storageUtil';

// Definición de la interfaz para las tareas
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const STORAGE_KEY = 'app-todo-list-tasks';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-lg mx-auto mt-10 p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
      
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <span class="text-blue-500">🚀</span> Tareas de Dev
      </h2>

      <div class="flex gap-2 mb-6">
        <input 
          type="text" 
          [(ngModel)]="newTodoText"
          (keyup.enter)="addTodo()"
          placeholder="¿Qué sigue en el código?..." 
          class="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button 
          (click)="addTodo()"
          class="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md shadow-blue-500/20">
          +
        </button>
      </div>

      <div class="space-y-2">
        @for (todo of todos(); track todo.id) {
          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 rounded-lg group hover:border-blue-300 dark:hover:border-blue-800 transition-all">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                [checked]="todo.completed"
                (change)="toggleTodo(todo.id)"
                class="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-transparent text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span 
                [class.line-through]="todo.completed" 
                [class.text-slate-400]="todo.completed" 
                [class.dark:text-slate-500]="todo.completed"
                class="text-slate-700 dark:text-slate-200 font-medium break-all">
                {{ todo.text }}
              </span>
            </div>
            
            <button 
              (click)="removeTodo(todo.id)"
              class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all px-2"
              title="Eliminar">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        } @empty {
          <div class="flex flex-col items-center justify-center py-10 opacity-40">
            <span class="text-4xl mb-2">☕</span>
            <p class="text-slate-600 dark:text-slate-400 italic text-sm text-center px-4">
              Lista vacía. Tómate un café o anota el próximo bug.
            </p>
          </div>
        }
      </div>

      @if (todos().length > 0) {
        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
          <span>Total: {{ todos().length }}</span>
          <span>Hechas: {{ completedCount() }}</span>
        </div>
      }
    </div>
  `
})
export class TodoListComponent {
  // Estado reactivo con Signals
  todos = signal<TodoItem[]>([]);
  newTodoText = '';

  constructor() {
    // 1. Cargar datos iniciales desde tu storageUtil
    const saved = storage.readValue<TodoItem[]>(STORAGE_KEY);
    if (saved) {
      this.todos.set(saved);
    }

    // 2. Efecto automático: Cada vez que 'todos' cambie, guardamos en LocalStorage
    effect(() => {
      storage.writeValue(STORAGE_KEY, this.todos());
    });
  }

  // Contador derivado (computed)
  completedCount() {
    return this.todos().filter(t => t.completed).length;
  }

  addTodo() {
    if (!this.newTodoText.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now(),
      text: this.newTodoText.trim(),
      completed: false,
      createdAt: new Date()
    };

    this.todos.update(prev => [newTodo, ...prev]);
    this.newTodoText = ''; // Limpiar input
  }

  toggleTodo(id: number) {
    this.todos.update(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }

  removeTodo(id: number) {
    this.todos.update(prev => prev.filter(todo => todo.id !== id));
  }
}