const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuração do MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'livros';
let db;

// Conectando ao MongoDB
async function connectToDB() {
  try {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to the database');
    db = client.db(dbName);
  } catch (err) {
    console.error('Failed to connect to the database. Error:', err);
    throw err; // Se quiser lidar com o erro de forma diferente, modifique esta linha
  }
}

// Middleware para conectar ao banco de dados antes de iniciar o servidor
app.use(async (req, res, next) => {
  if (!db) {
    try {
      await connectToDB();
      next();
    } catch (err) {
      res.status(500).send('Failed to connect to the database');
    }
  } else {
    next();
  }
});

// Configuração do EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// Configuração para servir arquivos estáticos (styles.css, por exemplo)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial
app.get('/', async (req, res) => {
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;

  try {
    const books = await db.collection('books')
      .find()
      .skip((perPage * page) - perPage)
      .limit(perPage)
      .toArray();

    const count = await db.collection('books').countDocuments();
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, count);

    res.render('index', {
      books,
      current: page,
      pages: Math.ceil(count / perPage),
      count,
      start,
      end
    });
  } catch (err) {
    console.error('Error fetching data from the database. Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
