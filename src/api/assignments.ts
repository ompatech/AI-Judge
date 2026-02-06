import { supabase } from "../lib/supabase";

export type AssignmentRow = {
  queue_id: string;
  template_id: string;
  judge_id: string;
  created_at: string;
};

export async function listAssignments(queueId: string): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from("judge_assignments")
    .select("*")
    .eq("queue_id", queueId);

  if (error) throw new Error(error.message);
  return (data ?? []) as AssignmentRow[];
}

// Save all assignments for a queue by replacing them.
// map: templateId -> judgeIds[]
export async function replaceAssignments(queueId: string, map: Record<string, string[]>) {
  // delete existing
  const { error: delErr } = await supabase.from("judge_assignments").delete().eq("queue_id", queueId);
  if (delErr) throw new Error(delErr.message);

  // insert new
  const rows = Object.entries(map).flatMap(([templateId, judgeIds]) =>
    judgeIds.map((judgeId) => ({
      queue_id: queueId,
      template_id: templateId,
      judge_id: judgeId,
    }))
  );

  if (rows.length === 0) return;

  const { error: insErr } = await supabase.from("judge_assignments").insert(rows);
  if (insErr) throw new Error(insErr.message);
}
