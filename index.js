const express = require('express');
const { randomUUID } = require('crypto');
const app = express();
const {createClient} = require('redis');
const client=createClient( { url: 'redis://localhost:6379' });
client.on('error', (err) => console.log('Redis Client Error', err));
app.use(express.json());
app.post('/jobs', async (req, res) => {
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
    res.status(200).json(job);
     if (Object.keys(job).length === 0)// checks if the job with the given ID exists in Redis
  {
     
    return res.status(404).json({ error: 'Job not found' });
  }
   
      
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
