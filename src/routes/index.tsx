import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { CaseInspectorTab } from "@/components/dashboard/CaseInspectorTab";
import { ImpactTab } from "@/components/dashboard/ImpactTab";
import { Sidebar } from "../components/dashboard/Sidebar";
import { processKpis } from "@/lib/kpi-server";
import { type Emotion } from "@/lib/emotions";
import devgptLogo from "../../assets/DevGPT_Logo.png";

const title = "DevGPT Emotion Analytics — Developer–LLM Affect Dashboard";
const description =
  "Thesis dashboard analysing emotion in developer–ChatGPT conversations: distribution, carryover effects, escalation trends and impact of developer affect on assistant responses.";

export const Route = createFileRoute("/")({
  loader: async () => {
    return await processKpis();
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [activeFilters, setActiveFilters] = React.useState<Emotion[]>([]);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="h-screen flex flex-col bg-background overflow-hidden"
    >
      <header className="shrink-0 bg-background/95 backdrop-blur-md z-30 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 pt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-left flex flex-col items-start">
              <p className="numeral text-[14px] uppercase tracking-[0.18em] text-muted-foreground">
                CHAIR OF INFORMATION VISUALIZATION ·
                <span style={{ color: "var(--emotion-neutral)" }}>
                  UNIVERSITY OF BAMBERG
                </span>
              </p>
              <h1 className="display mt-1 text-3xl leading-none text-foreground sm:text-4xl">
                DevGPT Emotion Analytics Dashboard
              </h1>
            </div>
            <span className="relative h-20 w-20 overflow-hidden rounded-full p-1">
              <img
                src={devgptLogo}
                alt="DevGPT logo"
                className="h-full w-full"
              />
            </span>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Analyzing dynamics of Developers-ChatGPT conversations;
              <br />
              labelled with an SE-specific four-class scheme:
              <span style={{ color: "var(--emotion-frustration)" }}>
                <b> frustration</b>
              </span>
              ,{" "}
              <span style={{ color: "var(--emotion-caution)" }}>
                <b>caution</b>
              </span>
              ,{" "}
              <span style={{ color: "var(--emotion-neutral)" }}>
                <b>neutral</b>
              </span>
              ,{" "}
              <span style={{ color: "var(--emotion-satisfaction)" }}>
                <b>satisfaction</b>
              </span>
              .
            </p>
            <div className="self-start md:self-auto mb-0">
              <TabsList className="bg-transparent border-none p-0 rounded-none h-auto gap-1.5 translate-y-[1px] z-10 flex">
                <TabsTrigger
                  value="overview"
                  className="rounded-t-lg rounded-b-none border-t border-x border-b border-border/80 bg-muted/85 text-muted-foreground/80 hover:bg-muted hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-5 py-2.5 text-xs md:text-sm font-semibold transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="impact"
                  className="rounded-t-lg rounded-b-none border-t border-x border-b border-border/80 bg-muted/85 text-muted-foreground/80 hover:bg-muted hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-5 py-2.5 text-xs md:text-sm font-semibold transition-all"
                >
                  Detailed Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="deep"
                  className="rounded-t-lg rounded-b-none border-t border-x border-b border-border/80 bg-muted/85 text-muted-foreground/80 hover:bg-muted hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-5 py-2.5 text-xs md:text-sm font-semibold transition-all"
                >
                  Case Inspector
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full mx-auto max-w-[1400px] px-6 py-4 min-h-0">
        <div className="grid flex-1 h-full gap-4 lg:grid-cols-5 lg:gap-x-6 min-h-0">
          <div className="lg:col-span-1 h-full overflow-y-auto pr-2 pb-4">
            {/* Sidebar for filters and summary */}
            <div className="mx-0 h-full">
              {/* Lazy load the sidebar to avoid circular imports in routing contexts */}
              <React.Suspense fallback={<div className="h-40" />}>
                <Sidebar
                  activeFilters={activeFilters}
                  setActiveFilters={setActiveFilters}
                />
              </React.Suspense>
            </div>
          </div>

          <section className="lg:col-span-4 h-full overflow-y-auto pl-2 pb-4">
            <TabsContent
              value="overview"
              className="m-0 focus-visible:outline-none"
            >
              <OverviewTab
                activeFilters={activeFilters}
                setActiveTab={setActiveTab}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
            <TabsContent
              value="deep"
              className="m-0 focus-visible:outline-none h-full"
            >
              <CaseInspectorTab
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
            <TabsContent
              value="impact"
              className="m-0 focus-visible:outline-none"
            >
              <ImpactTab activeFilters={activeFilters} />
            </TabsContent>
          </section>
        </div>
      </main>
    </Tabs>
  );
}
