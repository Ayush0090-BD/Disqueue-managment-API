const express = require('express');
const { randomUUID } = require('crypto');
const app = express();
app.use(express.json());
const jobs = [];
app.post('/jobs', (req, res) => {
  const jobData = {
    id: randomUUID(),
    title: req.body.title.trim(),
    status: 'Accepted & pending',
    createdat: new Date().toISOString()

  };
  if(!typeof jobData.title === 'string' || jobData.title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  jobs.push(jobData);
  // Process the job asynchronously (simulated with a timeout)
  res.status(202).json(jobData);
});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});