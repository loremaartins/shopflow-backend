# ShopFlow Backend 🚀

O **ShopFlow Backend** é uma API RESTful completa desenvolvida para gerenciar um ecossistema de e-commerce e controle de estoque de forma escalável e eficiente. Este sistema atua como o motor central para o gerenciamento de produtos, categorias, carrinhos de compras e fluxo de pedidos, integrando tecnologias modernas do ecossistema JavaScript/TypeScript.

## 🛠️ Tecnologias Utilizadas

*   **Node.js**: Ambiente de execução para rodar o JavaScript no lado do servidor de forma assíncrona e orientada a eventos.
*   **TypeScript**: Adiciona tipagem estática ao código, aumentando a previsibilidade, a segurança durante o desenvolvimento e reduzindo a incidência de bugs em produção.
*   **Express**: Framework web minimalista e flexível que facilita o gerenciamento de rotas, middlewares e requisições HTTP.
*   **Prisma ORM**: Object-Relational Mapper moderno integrado ao TypeScript para gerenciamento, versionamento (migrations) e consultas seguras em bancos de dados relacionais.

## 🏗️ Funcionalidades Principais

*   **Gestão de Estoque & Produtos**: CRUD completo de itens com controle de quantidade disponível em tempo real.
*   **Categorização**: Estrutura organizada para gerenciar coleções e categorias de produtos.
*   **Fluxo de E-commerce**: Manipulação do carrinho de compras e validação do fluxo de fechamento de pedidos (checkout).
*   **Camada de Persistência Segura**: Modelagem de dados estruturada utilizando as melhores práticas do Prisma.

## 📁 Estrutura do Projeto

*   `prisma/`: Arquivos de configuração do Prisma e arquivos de migrações estruturais do banco de dados.
*   `src/`: Todo o código-fonte da aplicação (rotas, controllers, serviços e regras de negócio estruturadas).
*   `.gitignore`: Definição de arquivos e variáveis de ambiente confidenciais que devem ser ignorados pelo controle de versão.

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Antes de começar, certifique-se de ter instalado em sua máquina o **Node.js** e um gerenciador de pacotes (npm, yarn ou pnpm).

### Passo a Passo

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com
    cd shopflow-backend
    ```

2.  **Instalar as dependências:**
    ```bash
    npm install
    ```

3.  **Configurar as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto e configure a URL de conexão com o seu banco de dados, seguindo o exemplo:
    ```env
    DATABASE_URL="postgresql://usuario:senha@localhost:5432/shopflow_db?schema=public"
    ```

4.  **Executar as Migrations do Prisma:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Iniciar o servidor em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```

---
Desenvolvido com 💻 por Lorelayne Martins.
