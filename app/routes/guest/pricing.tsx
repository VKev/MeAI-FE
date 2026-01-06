import { useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { fetchSubscriptionsClient } from "@/services/client/subscription.client";
import { fetchSubscriptions } from "@/services/server/subscription.server";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import type { SubscriptionListResponse } from "@/models/subscription.model";

export async function loader({ request }: LoaderFunctionArgs) {
  const data = await fetchSubscriptions(request);
  return data;
}

export default function Pricing() {
  // server side fetching
  const data = useLoaderData<typeof loader>() as SubscriptionListResponse;

  useEffect(() => {
    console.log("Server Subscriptions data:", data);
  }, [data]);

  // client side fetching
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ["subscriptions"],
  //   queryFn: fetchSubscriptionsClient,
  // });

  // useEffect(() => {
  //   if (data) console.log("Client subscriptions:", data);
  // }, [data]);

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error</div>;

  return <div>Pricing</div>;
}
