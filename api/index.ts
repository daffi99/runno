import app from '../src/server/api';

export default function handler(req: any, res: any) {
  return app(req, res);
}
