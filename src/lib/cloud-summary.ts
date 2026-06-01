type EstimateLike = {
  status?: unknown;
  estimateAmount?: unknown;
  followUps?: unknown;
};

type AppDataLike = {
  estimates?: EstimateLike[];
};

function amount(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function followUps(value: unknown) {
  return Array.isArray(value) ? value as Array<{ status?: unknown }> : [];
}

export function buildAppSummary(data: AppDataLike) {
  const estimates = Array.isArray(data.estimates) ? data.estimates : [];
  const pending = estimates.filter((estimate) => estimate.status === "Pending");
  const won = estimates.filter((estimate) => estimate.status === "Won");
  const lost = estimates.filter((estimate) => estimate.status === "Lost");
  const sentFollowUps = estimates.flatMap((estimate) =>
    followUps(estimate.followUps).filter((followUp) => followUp.status === "Sent"),
  );

  return {
    totalEstimates: estimates.length,
    pendingEstimates: pending.length,
    wonEstimates: won.length,
    lostEstimates: lost.length,
    sentFollowUps: sentFollowUps.length,
    openEstimateValue: pending.reduce(
      (sum, estimate) => sum + amount(estimate.estimateAmount),
      0,
    ),
    wonEstimateValue: won.reduce(
      (sum, estimate) => sum + amount(estimate.estimateAmount),
      0,
    ),
    lostEstimateValue: lost.reduce(
      (sum, estimate) => sum + amount(estimate.estimateAmount),
      0,
    ),
  };
}
