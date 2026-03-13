import { Router, Request, Response } from 'express';

const router = Router();
const sseClients = new Set<Response>();

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.add(res);
  res.write(': heartbeat\n\n');

  req.on('close', () => {
    sseClients.delete(res);
  });
});

export function broadcastEvent(eventName: string, data: object) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    client.write(payload);
  });
}

export default router;
