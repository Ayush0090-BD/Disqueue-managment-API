const express = require('express');
require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET); // Log the JWT secret to verify it's loaded correctly
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const authenticateToken = require('./middleware.js');
const app = express();
const jwt = require('jsonwebtoken');
const {createClient} = require('redis');
const client=createClient( { url: 'redis://localhost:6379' });
client.on('error', (err) => console.log('Redis Client Error', err));
app.use(express.json());
const user =[];
app.post('/register', async (req, res) => {
  const { username, password } = req.body;  
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (user.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  try{
  const hashedPassword = await bcrypt.hash(password, 10);
  user.push({ username, passwordhash: hashedPassword });
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(201).json({ message: 'User registered successfully', token });
} catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const userData = user.find(u => u.username === username);
  if (!userData) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }try {
  const sp= await bcrypt.compare(password, userData.passwordhash);
  if (!sp) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ message: 'Login successful', token });
}
catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/jobs', authenticateToken, async (req, res) => {
  console.log('Content-Type:', req.headers['content-type']);
console.log('Body:', req.body);
    if(!req.body || typeof req.body.title !== 'string' || req.body.title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });}
  const jobData = {
    id: randomUUID(),
    title: req.body.title.trim(),
    status: 'queued',
    createdat: new Date().toISOString()

  };
  try {
   await client.hSet(`job:${jobData.id}`, {
    id: jobData.id,
    title: jobData.title,
    status: jobData.status,
    createdat: jobData.createdat
   });
  //console.log(err);
    
    await client.rPush('jobs', JSON.stringify(jobData));
    
    res.status(202).json(jobData);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/jobs/:id', async (req, res) => {
  if (!req.params.id )//check if the job ID is provided in the request parameters
  {
    return res.status(400).json({ error: 'Job ID is required' });
  }
  
  try {
    const job = await client.hGetAll(`job:${req.params.id}`);//retrive the job metadata from redis
  
     if (Object.keys(job).length === 0)// checks if the job with the given ID exists in Redis
  {
     
    return res.status(404).json({ error: 'Job not found' });
  }
     res.status(200).json(job);
      
}
catch (error) {
    console.error('Error retrieving job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
async function startServer() {
  try {
    await client.connect();
    app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    process.exit(1);
  }
}
startServer();
