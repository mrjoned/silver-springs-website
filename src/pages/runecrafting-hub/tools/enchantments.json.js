import { enchantmentData } from '../../../lib/site-catalogs.js';
export const GET = () => Response.json(enchantmentData());
