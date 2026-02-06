import { supabase } from "../lib/supabase";

export type JudgeRow = {
  id: string;
  name: string;
  system_prompt: string;
  model: string;
  active: boolean;
  created_at: string;
};

export async function listJudges(): Promise<JudgeRow[]> {
  const { data, error } = await supabase
    .from("judges")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as JudgeRow[];
}

export async function createJudge(input: {
  name: string;
  system_prompt: string;
  model: string;
}) {
  const { error } = await supabase.from("judges").insert([
    {
      name: input.name,
      system_prompt: input.system_prompt,
      model: input.model,
      active: true,
    },
  ]);

  if (error) throw new Error(error.message);
}

export async function updateJudge(
  id: string,
  patch: Partial<Pick<JudgeRow, "name" | "system_prompt" | "model" | "active">>
) {
  const { error } = await supabase.from("judges").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listActiveJudges(): Promise<JudgeRow[]> {
  const { data, error } = await supabase
    .from("judges")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as JudgeRow[];
}
