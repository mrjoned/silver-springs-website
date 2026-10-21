import { renderTool } from '../../../lib/site-catalogs.js';
export const GET = () => new Response(renderTool('hub_comparison.html'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
