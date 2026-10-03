import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

export const dynamic = "force-dynamic";

export const POST = webhookCallback(bot, "std/http");

export async function GET() {
  return new Response("Bot endpoint is active", { status: 200 });
}
