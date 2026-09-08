import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { auth } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Express app wiring. Order is significant: the global middleware (cors, JSON
// body, request logging, then auth) runs before the routers so req.currentUser
// is available to every route, and the 404/error handlers run last so they
// catch anything the routers miss or throw.
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
// auth parses an optional Bearer JWT and, when valid, attaches the user as
// req.currentUser; route guards (requireAuth / requireRole) then decide access.
app.use(auth);

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.get('/health', (req, res) => res.json({ success: true, message: 'ok', data: { status: 'up' } }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
