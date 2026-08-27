const express = require('express');
const { auth } = require('./middleware/auth');
const projects = require('./routes/projects');

const app = express();

app.use(express.json());
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', auth);
app.use('/api/projects', projects);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`project-tracker api listening on ${port}`);
});
