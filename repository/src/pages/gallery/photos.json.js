import { photos } from '../../lib/photos.js';
export const prerender = true;
export function GET() { return Response.json(photos); }
