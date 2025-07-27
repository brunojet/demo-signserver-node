import { dbFieldMap } from './db_field_map';

// Converte objeto camelCase para snake_case usando o map global
export function toSnake(obj: any): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [camel, snake] of Object.entries(dbFieldMap)) {
    if (obj[camel] != null) {
      result[snake] = obj[camel];
    }
  }
  return result;
}

// Converte objeto snake_case para camelCase usando o map global
export function fromSnake(item: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [camel, snake] of Object.entries(dbFieldMap)) {
    if (item[snake] != null) {
      result[camel] = item[snake];
    }
  }
  return result;
}
