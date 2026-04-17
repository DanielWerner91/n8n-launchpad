import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = {
  title: "Copilot | LaunchPad",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight text-foreground">Copilot</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Chat with an AI that can read and update your projects, features, checklists, and launches.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
