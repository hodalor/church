import { AlertTriangle, Sparkles } from 'lucide-react';

export default function SmartInsightBanner({ insights }) {
  if (!insights) {
    return null;
  }

  const headline = insights.lowGivingAlert?.triggered
    ? insights.lowGivingAlert.message
    : insights.currentMonthProjection?.message;

  return (
    <div className="rounded-3xl border border-accent/30 border-l-4 bg-[#151d2f] p-5 text-white shadow-xl shadow-black/20">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-accent/15 p-3 text-accent">
          {insights.lowGivingAlert?.triggered ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent/90">Smart Giving Intelligence</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{headline}</h3>
          </div>
          {insights.recommendations?.length ? (
            <ul className="space-y-2 text-sm text-white/70">
              {insights.recommendations.map((recommendation) => (
                <li key={recommendation}>• {recommendation}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
