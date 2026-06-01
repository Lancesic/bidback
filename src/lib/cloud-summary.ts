type EstimateLike = {
  status?: string;
  estimateAmount?: number;
  followUps?: Array<{ status?: string }>;
};

type AppDataLike = {
  estimates?: EstimateLike[];
};

export function buildAppSummary(data: AppDataLike) {
  const estimates = data.estimates ?? [];
  const pending = estimates.filter((estimate) => estimate.status === "Pending");
  const won = estimates.filter((estimate) => estimate.status === "Won");
  const lost = estimates.filter((estimate) => estimate.status === "Lost");
  const sentFollowUps = estimates.flatMap((estimate) =>
    estimate.followUps?.filter((followUp) => followUp.status === "Sent") ?? [],
  );

  return {
    totalEstimates: estimates.length,
    pendingEstimates: pending.length,
    wonEstimates: won.length,
    lostEstimates: lost.length,
    sentFollowUps: sentFollowUps.length,
    openEstimateValue: pending.reduce(
      (sum, estimate) => sum + (estimate.estimateAmount ?? 0),
      0,
    ),
    wonEstimateValue: won.reduce(
      (sum, estimate) => sum + (estimate.estimateAmount ?? 0),
      0,
    ),
    lostEstimateValue: lost.reduce(
      (sum, estimate) => sum + (estimate.estimateAmount ?? 0),
      0,
    ),
  };
}
