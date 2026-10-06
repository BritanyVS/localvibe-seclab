"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { askConcierge, fetchPlaces } from "@/lib/api";
import type { ChatMessage, Place } from "@/lib/types";
import { ChatIcon, CloseIcon, SendIcon } from "./icons";

const quickPrompts = [
  "Un café tranquilo para leer",
  "Quiero una actividad de acampada en Limón",
  "Playas para el fin de semana en Guanacaste",
];

const welcome: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy Vibe, tu asistente de Costa Rica Vibe. Decime provincia y qué plan tenés en mente, y te recomiendo lugares de las 7 provincias con toda la vibra.",
};

export function VibeChat({
  open,
  onToggle,
  onSelectPlace,
}: {
  open: boolean;
  onToggle: () => void;
  onSelectPlace: (p: Place) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [catalog, setCatalog] = useState<Place[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlaces()
      .then(setCatalog)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  const addMessage = (message: ChatMessage) => setMessages((prev) => [...prev, message]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;
    setInput("");
    addMessage({ role: "user", content });
    setThinking(true);
    try {
      const reply = await askConcierge(content, messages);
      addMessage({ role: "assistant", content: reply.reply, placeIds: reply.placeIds });
    } catch {
      addMessage({
        role: "assistant",
        content: "Ups, se me perdió la conexión un segundo. ¿Me lo recuerdas?",
      });
    } finally {
      setThinking(false);
    }
  };

  const catalogById = new Map(catalog.map((place) => [place.id, place]));

  return (
    <>
      <button
        onClick={onToggle}
        aria-label={open ? "Cerrar a Vibe" : "Hablar con Vibe"}
        className="fixed bottom-6 right-6 z-50 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blush-400 via-lilac-400 to-lilac-500 text-white shadow-xl shadow-blush-300/50 ring-4 ring-white/60 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>

      {open && (
        <section
          className="fixed bottom-6 right-6 z-40 flex h-[32rem] w-[calc(100vw-3rem)] max-w-md animate-fadeUp flex-col overflow-hidden rounded-3xl glass"
        >
          <header className="flex items-center gap-3 border-b border-blush-100 bg-gradient-to-r from-blush-50 to-lilac-50 px-5 py-4">
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-lilac-400 to-blush-400 font-display text-lg font-semibold text-white shadow-soft">
              V
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-neutral-800">Vibe</p>
              <p className="text-xs text-neutral-500">Tu guía de Costa Rica con IA</p>
            </div>
          </header>

          <div ref={scrollRef} className="chat-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((message, index) => (
              <div key={index} className="animate-fadeUp space-y-2">
                <div
                  className={
                    message.role === "user"
                      ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-blush-400 to-lilac-500 px-4 py-2.5 text-sm text-white shadow-md shadow-blush-200/50"
                      : "w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-blush-100 bg-white px-4 py-2.5 text-sm text-neutral-700 shadow-sm"
                  }
                >
                  {message.content}
                </div>
                {message.placeIds && message.placeIds.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1 chat-scroll">
                    {message.placeIds.map((id) => {
                      const place = catalogById.get(id);
                      if (!place) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => onSelectPlace(place)}
                          className="group w-36 shrink-0 overflow-hidden rounded-2xl border border-blush-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <Image
                              src={place.image}
                              alt={place.name}
                              fill
                              sizes="144px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <p className="truncate px-3 py-2 text-xs font-semibold text-neutral-700">
                            {place.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {thinking && (
              <div className="w-fit rounded-2xl rounded-bl-md border border-blush-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blush-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-lilac-400 [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold-300 [animation-delay:0.3s]" />
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="rounded-full border border-lilac-200 bg-lilac-50 px-3.5 py-1.5 text-xs font-medium text-lilac-600 transition-colors hover:bg-lilac-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-blush-100 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              className="h-11 w-full rounded-full border border-blush-100 bg-white/80 px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-blush-300"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={thinking}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-r from-blush-400 to-lilac-500 text-white shadow-md shadow-blush-200/50 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
