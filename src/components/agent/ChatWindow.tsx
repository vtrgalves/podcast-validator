import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveMessage, renameThread } from "@/lib/threads.functions";
import { AgentWelcome } from "./AgentWelcome";

function textOf(message: UIMessage) {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

export function ChatWindow({
  threadId,
  initialMessages,
  isNewThread,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  isNewThread: boolean;
}) {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const titledRef = useRef(!isNewThread);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: ({ message }) => {
      void saveMessage({
        data: {
          threadId,
          role: "assistant",
          aiMessageId: message.id,
          parts: message.parts as unknown as Array<Record<string, unknown>>,
        },
      }).then(() => queryClient.invalidateQueries({ queryKey: ["threads"] }));
    },
    onError: (error) => {
      toast.error(error.message || "O agente não conseguiu responder agora.");
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  async function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");

    void saveMessage({
      data: {
        threadId,
        role: "user",
        parts: [{ type: "text", text: trimmed }],
      },
    });

    if (!titledRef.current) {
      titledRef.current = true;
      void renameThread({
        data: { id: threadId, title: trimmed.slice(0, 60) },
      }).then(() => queryClient.invalidateQueries({ queryKey: ["threads"] }));
    }

    await sendMessage({ text: trimmed });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <AgentWelcome onPick={(q) => void submitText(q)} />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.role === "assistant" ? (
                    <MessageResponse>{textOf(message)}</MessageResponse>
                  ) : (
                    <span className="whitespace-pre-wrap">{textOf(message)}</span>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <div className="px-1 py-2">
              <Shimmer>Analisando estrategicamente…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <PromptInput
            onSubmit={(_, event) => {
              event.preventDefault();
              void submitText(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre estratégia, monetização, patrocínio ou valide uma ideia de podcast…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!input.trim() && !busy} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Respostas fundamentadas na base de conhecimento da VTR Gestão. Estimativas são
            sinalizadas como tal.
          </p>
        </div>
      </div>
    </div>
  );
}
