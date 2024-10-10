// Necessary Imports
import express from "express";
import bodyParser from "body-parser";
import pkg from 'pg';
const { Client } = pkg;


// PostgreSQL Connection
const client = new Client({
   user: 'postgres',
   host: 'localhost',
   database: 'BlogDB',
   password: 'riley626',
   port: 5432,
});

client.connect();

// Constants
const app = express();
const port = 3001;

// EJS & BodyParser
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(bodyParser.urlencoded( {extended: true} ));

// We start at the login screen
app.get("/", (req, res) => {
   res.render("login");
});

// Blog Post Handle
app.get("/blogs", async (req, res) => {
   try {
       const result = await client.query('SELECT * FROM blogs ORDER BY date_created DESC');
       const blogPosts = result.rows;
       res.render("blogs", { blogPostArray: blogPosts });
   } catch (err) {
       console.error(err);
       res.status(500).send('Error fetching blog posts');
   }
});




app.post("/new-post", async (req, res) => {
   const { title, author, body } = req.body;

   try {
       await client.query(
           'INSERT INTO blogs (creator_name, title, body, date_created) VALUES ($1, $2, $3, NOW())',
           [author, title, body]
       );
       res.redirect("/blogs");
   } catch (err) {
       console.error(err);
       res.status(500).send('Error inserting new blog post');
   }
});


// Edit Page Handle
app.get("/edit/:id", async (req, res) => {
   const postID = req.params.id; // Get the blog ID from the URL

   try {
       const result = await client.query('SELECT * FROM blogs WHERE blog_id = $1', [postID]);
       if (result.rows.length > 0) {
           const blogPost = result.rows[0]; // Get the blog post from the database
           res.render("edit", { blogPost: blogPost, postID: postID });
       } else {
           res.status(404).send('Blog post not found');
       }
   } catch (err) {
       console.error(err);
       res.status(500).send('Error fetching blog post');
   }
});


app.post("/edit/:id", async (req, res) => {
   const postID = req.params.id;
   const { title, author, body } = req.body;

   try {
       await client.query(
           'UPDATE blogs SET title = $1, body = $2, creator_name = $3 WHERE blog_id = $4',
           [title, body, author, postID]
       );
       res.redirect("/blogs"); // Redirect to the blogs page after successful update
   } catch (err) {
       console.error(err);
       res.status(500).send('Error updating blog post');
   }
});



// Handle Deleting
app.post("/delete/:id", async (req, res) => {
   const postID = req.params.id;

   try {
       await client.query('DELETE FROM blogs WHERE blog_id = $1', [postID]);
       res.redirect("/blogs");
   } catch (err) {
       console.error(err);
       res.status(500).send('Error deleting blog post');
   }
});


// Signup

// Render signup page
app.get("/signup", (req, res) => {
   res.render("signup");
});

app.post("/signup", async (req, res) => {
   const { user_id, password, name } = req.body;

   try {
       const result = await client.query('SELECT * FROM users WHERE user_id = $1', [user_id]);

       if (result.rows.length > 0) {
           res.send('User ID already taken. Please choose another.');
       } else {
           await client.query(
               'INSERT INTO users (password, name) VALUES ($1, $2)',
               [password, name]
           );
           res.redirect("/login");
       }
   } catch (err) {
       console.error(err);
       res.status(500).send('Error signing up user');
   }
});

// Login

// Render signin page
app.get("/login", (req, res) => {
   res.render("login");
});

app.post("/login", async (req, res) => {
   const { name, password } = req.body; // Use 'name' instead of 'user_id'

   try {
       const result = await client.query('SELECT * FROM users WHERE name = $1', [name]); // Query by name
       if (result.rows.length > 0) {
           const user = result.rows[0];
           if (password === user.password) {  // Plain text password comparison
               res.redirect("/blogs");
           } else {
               res.render("login", { error: 'Incorrect password' });
           }
       } else {
           res.render("login", { error: 'User not found' });
       }
   } catch (err) {
       console.error(err);
       res.status(500).send('Error signing in user');
   }
});




// Basic Listening for Console
app.listen(port, () => {
   console.log(`Server running on port ${port}.`)});

// Graceful exit for the Connection
process.on('exit', () => {
    client.end(() => {
        console.log('PostgreSQL client disconnected');
    });
});