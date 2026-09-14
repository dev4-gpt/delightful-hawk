/**
 * Vercel Serverless Function: TomTom Status API
 * 
 * Reports whether TOMTOM_API_KEY is configured and budget metadata.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const apiKey = (process.env.TOMTOM_API_KEY || '').trim();
  const hasKey = Boolean(apiKey);

  const rawBudget = Number.parseInt(process.env.TOMTOM_DAILY_TILE_BUDGET || '', 10);
  const budget = Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : 40000;

  return res.status(200).json({
    hasKey,
    dailyCount: 0,
    budget,
    date: new Date().toISOString().slice(0, 10),
    provider: hasKey ? 'TomTom Live Flow' : 'Simulation Mode'
  });
}
