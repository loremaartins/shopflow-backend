 import express from 'express'
import cors from 'cors'
import { prisma } from './lib/prisma'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'));

// Rota inicial de status
app.get('/', (req, res) => {
  res.json({ mensagem: 'API ShopFlow rodando com sucesso!' })
})

// --- 1. USUÁRIOS E AUTENTICAÇÃO ---
app.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || 'CUSTOMER',
        cart: { create: {} } // Já cria o carrinho do usuário
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.status(201).json(user)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar usuário. E-mail já cadastrado ou dados inválidos.' })
  }
})

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })
  res.json(users)
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || user.password !== password) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' })
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao realizar login.' })
  }
})

// --- 2. CATEGORIAS E PRODUTOS ---
app.post('/categories', async (req, res) => {
  try {
    const { name } = req.body
    const category = await prisma.category.create({ data: { name } })
    res.status(201).json(category)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar categoria.' })
  }
})

app.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { products: true }
  })
  res.json(categories)
})

app.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true }
  })
  if (!product) return res.status(404).json({ erro: 'Produto não encontrado.' })
  res.json(product)
})

// --- 3. CARRINHO DE COMPRAS ---
app.get('/cart/:userId', async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.params.userId },
      include: { items: { include: { product: true } } }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.params.userId },
        include: { items: { include: { product: true } } }
      })
    }

    res.json(cart)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao buscar carrinho.' })
  }
})

app.post('/cart/:userId/items', async (req, res) => {
  try {
    const { userId } = req.params
    const { productId, quantity = 1 } = req.body

    let cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    })

    if (existingItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true }
      })
      return res.json(updated)
    }

    const item = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
      include: { product: true }
    })

    res.status(201).json(item)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao adicionar item ao carrinho.' })
  }
})

app.delete('/cart/items/:itemId', async (req, res) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.itemId } })
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao remover item do carrinho.' })
  }
})

// --- 4. PEDIDOS (CHECKOUT) ---
app.post('/orders', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ erro: 'userId é obrigatório' });
  }

  try {
    // 1. Busca o carrinho com os itens e dados dos produtos
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ erro: 'O carrinho está vazio' });
    }

    // 2. Valida se há estoque suficiente para todos os itens
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          erro: `Estoque insuficiente para o produto: ${item.product.name}`,
        });
      }
    }

    // 3. Calcula o valor total do pedido
    const total = cart.items.reduce((acc, item) => {
      return acc + Number(item.product.price) * item.quantity;
    }, 0);

    // 4. Executa tudo de forma atômica no banco
    const order = await prisma.$transaction(async (tx) => {
      // Cria o pedido salvando o preço histórico
      const createdOrder = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Abate a quantidade do estoque de cada produto
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Limpa os itens do carrinho após fechar o pedido
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return createdOrder;
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar pedido' });
  }
});

// Listar pedidos de um usuário
app.get('/orders/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
});

const PORT = process.env.PORT || 3000;
app.post("/products", async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;
    if (!name || price === undefined || isNaN(Number(price))) {
      return res.status(400).json({ erro: "Preencha nome e preço válidos." });
    }
    let cat = await prisma.category.findFirst();
    if (!cat) cat = await prisma.category.create({ data: { name: "Geral" } });
    const product = await prisma.product.create({
      data: {
        name: String(name),
        description: description ? String(description) : "",
        price: Number(price),
        stock: Number(stock) || 10,
        imageUrl: imageUrl || null,
        categoryId: cat.id
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    res.status(500).json({ erro: "Erro interno ao cadastrar produto." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
