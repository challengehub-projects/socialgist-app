import { supabase } from "../configs/supbase";
import { sendNotification } from "../utils/sendNotifications";

export const getOrCreateConversation = async (
  meId,
  otherUserId
) => {
  if (!meId || !otherUserId) {
    return null;
  }

  const [a, b] =
    meId < otherUserId
      ? [meId, otherUserId]
      : [otherUserId, meId];

  const chatKey = `${a}_${b}`;

  // FIND EXISTING

  const {
    data: existing,
    error: findError,
  } = await supabase
    .from("conversations")
    .select("*")
    .eq("chat_key", chatKey)
    .maybeSingle();

  if (findError) {
    console.log(findError);
    return null;
  }

  let conversation =
    existing;

  // CREATE IF MISSING

  if (!conversation) {
    const {
      data: created,
      error: createError,
    } = await supabase
      .from("conversations")
      .insert({
        chat_key: chatKey,
      })
      .select()
      .single();

    await sendNotification({

      title:
        "Message Sent",

      body:
        "You have a new conversation!",

    });

    if (createError) {
      console.log(createError);
      return null;
    }

    conversation =
      created;
  }

  // ENSURE MEMBERS EXIST

  const {
    error: memberError,
  } = await supabase
    .from(
      "conversation_members"
    )
    .upsert(
      [
        {
          conversation_id:
            conversation.id,
          user_id: a,
        },
        {
          conversation_id:
            conversation.id,
          user_id: b,
        },
      ],
      {
        onConflict:
          "conversation_id,user_id",
      }
    );

  if (memberError) {
    console.log(
      memberError
    );
  }

  // GET LAST MESSAGE

  const {
    data: lastMessage,
  } = await supabase
    .from("messages")
    .select("*")
    .eq(
      "conversation_id",
      conversation.id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();



  await sendNotification({

    title:
      "New Messages",

    body:
      lastMessage,

  });

  return {
    conversationId:
      conversation.id,

    chatKey,

    exists:
      !!existing,

    lastMessage:
      lastMessage || null,
  };
};