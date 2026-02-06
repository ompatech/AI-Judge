import { supabase } from "../lib/supabase";

export type QueueRow = {
  queue_id: string;
  created_at: string;
};

export async function listQueues(): Promise<QueueRow[]> {
  const { data, error } = await supabase
    .from("queues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as QueueRow[];
}
