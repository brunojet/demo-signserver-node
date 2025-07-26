import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API demo-signserver Node.js está rodando!');
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
