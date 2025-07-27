import { toSnake, fromSnake } from '../snake_utils';

describe('snake_utils', () => {
  it('toSnake should map camelCase to snake_case using dbFieldMap', () => {
    const obj = { name: 'A', profileId: 'P', isActive: true };
    const snake = toSnake(obj);
    expect(snake).toEqual({ name: 'A', profile_id: 'P', is_active: true });
  });

  it('fromSnake should map snake_case to camelCase using dbFieldMap', () => {
    const snake = { name: 'B', profile_id: 'Q', is_active: false };
    const camel = fromSnake(snake);
    expect(camel).toEqual({ name: 'B', profileId: 'Q', isActive: false });
  });
});
