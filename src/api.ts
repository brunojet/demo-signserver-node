import express from 'express';
import { httpObservabilityMiddleware } from './observability/http_observability_middleware';


const app = express();
const port = process.env.PORT || 3000;


// Aplica o middleware de observabilidade antes das rotas
app.use(httpObservabilityMiddleware);

app.get('/', (req, res) => {
  res.send('API demo-signserver Node.js está rodando!');
});


app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
