import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3333;

// Middleware para o Express entender dados em formato JSON
app.use(express.json());

// Rota de teste para sabermos se a API está a funcionar
app.get('/', (req: Request, res: Response) => {
  return res.json({ 
    message: 'ShopFlow API - Catálogo de Produtos a funcionar com sucesso! 🚀' 
  });
});

// Põe o servidor a escutar na porta definida
app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
