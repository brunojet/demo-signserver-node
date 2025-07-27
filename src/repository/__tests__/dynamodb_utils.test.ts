import { buildUpdateExpression } from '../dynamodb_utils';

describe('buildUpdateExpression', () => {
  it('deve lançar erro se updates estiver vazio', () => {
    expect(() => buildUpdateExpression({})).toThrow('Nenhum campo para atualizar');
  });

  it('deve montar expressão para campos preenchidos', () => {
    const expr = buildUpdateExpression({ nome: 'abc', idade: 10 });
    expect(expr.UpdateExpression).toContain('SET');
    expect(expr.ExpressionAttributeNames).toHaveProperty('#nome');
    expect(expr.ExpressionAttributeNames).toHaveProperty('#idade');
    expect(expr.ExpressionAttributeValues).toHaveProperty(':v0');
    expect(expr.ExpressionAttributeValues).toHaveProperty(':v1');
  });
});
