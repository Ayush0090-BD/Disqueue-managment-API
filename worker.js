const {createClient} = require('redis');
const client=createClient( { url: 'redis://localhost:6379' });
client.on('error', (err) => console.log('Redis Client Error', err));
async function processJobs() {
  try {
    await client.connect();  
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    process.exit(1);
  }
  while (true) {
    const job = await client.blPop('jobs',0);

    if(job){
      const data=JSON.parse(job.element);
      await client.hSet(`job:${data.id}`, 'status', 'processing');
        console.log(`Processing job: ${data.title}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        await client.hSet(`job:${data.id}`, 'status', 'completed');
        console.log(`Completed job: ${data.title}`);
    }
  }
}
processJobs();