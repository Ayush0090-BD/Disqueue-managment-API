const express = require('express');
const { randomUUID } = require('crypto');
const app = express();
const {createClient} = require('redis');
const client=createClient( { url: 'redis://localhost:6379' });
client.on('error', (err) => console.log('Redis Client Error', err));
app.use(express.json());
app.post('/jobs', async (req, res) => {
  
    
    if(typeof req.body.title !== 'string' || req.body.title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });}
  const jobData = {
    id: randomUUID(),
    title: req.body.title.trim(),
    status: 'queued',
    createdat: new Date().toISOString()

  };
  try {
  
    
    await client.rPush('jobs', JSON.stringify(jobData));
    
    res.status(202).json(jobData);
  } catch (error) {
    console.error('Error creating job:', error);
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
