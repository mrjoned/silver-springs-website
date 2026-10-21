import { renderTool } from '../../../lib/site-catalogs.js';
export const GET = () => new Response(renderTool('hub_equipment_guide.html'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
