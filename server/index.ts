import express from 'express';
const app = express(); app.use(express.json({limit:'512kb'}));
app.get('/api/health', (_req,res) => res.json({ ok: true, project: 'self-healing-tests' }));
app.listen(5210, '127.0.0.1', () => console.log('[self-healing-tests] api ready on 5210'));
