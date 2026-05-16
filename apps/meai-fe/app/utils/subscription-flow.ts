import type { CurrentUserSubscription, Subscription } from '@/models/subscription.model';

export type SubscriptionActionState = 'current' | 'scheduled' | 'upgrade' | 'schedule' | 'subscribe' | 'locked';

export function getPlanActionState(
  plan: Subscription,
  currentPlan: Subscription | null,
  currentSubscription: CurrentUserSubscription | null,
  scheduledSubscription: CurrentUserSubscription | null
): SubscriptionActionState {
  if (currentSubscription?.subscriptionId === plan.id) {
    return 'current';
  }

  if (scheduledSubscription?.subscriptionId === plan.id) {
    return 'scheduled';
  }

  if (scheduledSubscription) {
    return 'locked';
  }

  if (currentSubscription && currentPlan) {
    return plan.cost > currentPlan.cost ? 'upgrade' : 'schedule';
  }

  return 'subscribe';
}
