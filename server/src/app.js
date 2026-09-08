import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { auth } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use(auth);

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api', publicRoutes);

app.get('/health', (req, res) => res.json({ success: true, message: 'ok', data: { status: 'up' } }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
