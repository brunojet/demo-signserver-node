// Retorna ConditionExpression para garantir existência do PK
export function conditionExistsExpression(pkField: string = 'PK') {
  return {
    ConditionExpression: `attribute_exists(${pkField})`
  };
}
// Utilitários para montagem de expressões e atributos DynamoDB

export function buildUpdateExpression(updates: Record<string, any>) {
  const updateFields = Object.keys(updates);
  if (updateFields.length === 0) {
    throw new Error('Nenhum campo para atualizar. O objeto de updates está vazio.');
  }
  const exprs: string[] = [];
  const attrNames: Record<string, string> = {};
  const attrValues: Record<string, any> = {};
  updateFields.forEach((field, i) => {
    exprs.push(`#${field} = :v${i}`);
    attrNames[`#${field}`] = field;
    const value = updates[field];
    if (typeof value === 'number') {
      attrValues[`:v${i}`] = { N: value.toString() };
    } else {
      attrValues[`:v${i}`] = { S: value };
    }
  });
  return {
    UpdateExpression: 'SET ' + exprs.join(', '),
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues,
  };
}

export function buildFilterExpression(conditions: Record<string, any>) {
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};
  const exprs: string[] = [];
  Object.entries(conditions).forEach(([k, v], i) => {
    names[`#${k}`] = k;
    if (typeof v === 'number') {
      values[`:v${i}`] = { N: v.toString() };
    } else {
      values[`:v${i}`] = { S: v };
    }
    exprs.push(`#${k} = :v${i}`);
  });
  return {
    FilterExpression: exprs.join(' AND '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };
}
