import { supabase } from "../configs/supbase";

export const getOrCreateConversation = async (meId, otherUserId) => {
  if (!meId || !otherUserId) return null;

  const [a, b] =
    meId < otherUserId
      ? [meId, otherUserId]
      : [otherUserId, meId];

  const chatKey = `${a}_${b}`;

  /* 1. FIND EXISTING CONVERSATION */
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .eq("chat_key", chatKey)
    .maybeSingle();

  if (findError) {
    console.log("findError:", findError);
    return null;
  }

  let conversationId = existing?.id;

  /* 2. CREATE IF NOT EXISTS */
  if (!conversationId) {
    const { data: convo, error: insertError } = await supabase
      .from("conversations")
      .insert({
        chat_key: chatKey,
      })
      .select("id")
      .single();

    if (insertError) {
      console.log("insertError:", insertError);
      return null;
    }

    conversationId = convo.id;
  }

  /* 3. ENSURE MEMBERS EXIST (SAFE UPSERT) */
  const { error: memberError } = await supabase
    .from("conversation_members")
    .upsert(
      [
        {
          conversation_id: conversationId,
          user_id: a,
        },
        {
          conversation_id: conversationId,
          user_id: b,
        },
      ],
      {
        onConflict: "conversation_id,user_id",
      }
    );

  if (memberError) {
    console.log("memberError:", memberError);
  }

  /* 4. ALWAYS RETURN SAME FORMAT */
  return {
    conversationId,
  };
};