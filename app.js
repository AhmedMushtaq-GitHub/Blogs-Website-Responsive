const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const blogRoutes = require('./routes/blogRoutes');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Blog = require('./models/blog');
const JWT_SECRET= 'sibfhjbwejhb%#*%#*&#Tjhdjeh+6e46';

// express app 
const app = express();
const port = process.env.PORT || 3000;
// connect to mongodb & listen for requests
const dbURI = 'mongodb+srv://user11:test1234@cluster0.edl2z.mongodb.net/cluster0?retryWrites=true&w=majority';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true.valueOf, useCreateIndex: true })
  .then(result => app.listen(port))
  .catch(err => console.log(err));

// register view engine
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

app.use(bodyParser.json());


// login 
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username }).lean()

  if (!user) {
    return res.json({ status: 'invalid', error: 'Invalid username/password' })
  }

  if (await bcrypt.compare(password, user.password)) {
    // the username, password combination is successful

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username
      },
      JWT_SECRET
    )

    return res.json({ status: 'ok', data: token })
  }

  res.json({ status: 'error', error: 'Invalid username/password' })
})



//register
app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
})

app.post('/register', async (req, res) => {

  const { username, password: plainTextPassword } = req.body;
  const user = await User.findOne({ username }).lean()

  if (user) {
    return res.json({ status: 'present', error: 'Invalid username/password' })
  }
  if (!username || typeof username !== 'string') {
    return res.json({ status: 'error', error: 'Invalid username' })
  }

  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    return res.json({ status: 'error', error: 'Invalid password' })
  }

  if (plainTextPassword.length < 8) {
    return res.json({
      status: 'error',
      error: 'Password too small. Should be atleast 8 characters'
    })
  }
  const password = await bcrypt.hash(plainTextPassword, 10);
  try {
    const res = await User.create({
      username, password
    })
    console.log(res);
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: 'error', error: 'Username already exits' })
    }
    throw error
  }


  res.json({ status: 'ok' });


})

app.get('/edit/:id', (req,res)=>{
  const id = req.params.id;
  Blog.findById(id)
    .then(result => {
      res.render('edit', { blog: result, title: 'Blog Details' });
      console.log(result);
    })
  
  
})

app.post('/edit/:id', (req,res) =>{
  const _id = req.params.id;
  const t= req.body.title;
  const a= req.body.snippet;
  const b= req.body.body;
  const update = async (_id) =>{
    try{
      const result = await Blog.updateOne({_id},{
        $set : {
          title : t,
          snippet : a,
          body : b
        }
      });
    }catch(err) {
      console.log(err);
    }
  };
  update(_id);

  res.redirect('/blogs');
})

// blog routes
app.use('/blogs', blogRoutes);




// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});