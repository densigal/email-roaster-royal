import { useEffect, useMemo, useState } from "react";
import { Flame, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Index = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState<string>("");
  const { toast } = useToast();

  const canSubmit = useMemo(() => text.trim().length > 20, [text]);

  useEffect(() => {
    const title = "Roast My Cold Email — Brutal, Funny Feedback";
    document.title = title;
    const desc = "Paste your cold email and get a witty roast with actionable fixes.";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({ title: "Too short", description: "Give me a full cold email to roast." });
      return;
    }
    try {
      setLoading(true);
      setRoast("");
      const resp = await fetch(`${supabaseUrl}/functions/v1/roast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnon}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error((errJson as any)?.error || "Request failed");
      }
      const json = await resp.json();
      setRoast((json as any)?.roast ?? "No roast returned. Try again.");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Something broke", description: "The roast master choked. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero animate-gradient-pan opacity-60" aria-hidden="true" />
        <div className="container relative mx-auto px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary shadow-sm">
              <Flame className="text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Roast My Cold Email</h1>
            <p className="mt-4 text-lg text-muted-foreground">Harsh but helpful. Paste your masterpiece; get punchy feedback, jokes, and concrete fixes.</p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <Card className="card-elevated">
              <CardContent className="p-0">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your cold email here... Include subject, opener, value prop, and CTA."
                  className="min-h-[260px] resize-y rounded-b-none border-0 bg-card/60 p-6 text-base"
                />
                <div className="flex items-center justify-between gap-4 border-t p-4">
                  <p className="text-sm text-muted-foreground">We’ll roast with wit and then suggest practical fixes.</p>
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="inline-flex"
                    aria-label="Roast my cold email"
                  >
                    <Wand2 className="opacity-80" />
                    {loading ? "Summoning roast…" : "Roast my cold email"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {roast && (
              <Card className="card-elevated mt-6 hover:translate-y-[-2px] transition-transform">
                <CardContent className="p-6">
                  <article aria-live="polite" aria-atomic="true">
                    {roast.split("\n").map((line, i) => (
                      <p key={i} className="whitespace-pre-wrap leading-7">{line}</p>
                    ))}
                  </article>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
