import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { QrCode, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block border border-primary/50 text-primary px-3 py-1 text-xs font-mono uppercase tracking-widest mb-6 bg-primary/10">
              Precision Industrial Tooling
            </div>
            <h1 className="text-5xl md:text-7xl font-sans font-bold leading-[1.1] tracking-tight mb-6">
              Equipment maintenance, <span className="text-primary block">zero friction.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl font-mono">
              Facilities teams place QR codes on physical assets. Anyone can scan to report a problem. Technicians fix it. No accounts required for reporters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                  GET STARTED <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-lg border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10">
                  SYSTEM LOGIN
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-32 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Workflow</h2>
            <p className="text-lg text-muted-foreground font-mono">Streamlined operations from incident to resolution.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center text-2xl font-mono text-primary font-bold">01</div>
              <h3 className="text-2xl font-bold">Tag Assets</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate and print unique QR codes for every piece of equipment (HVAC, generators, elevators). Stick them directly on the physical asset.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center text-2xl font-mono text-primary font-bold">02</div>
              <h3 className="text-2xl font-bold">Instant Scan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Anyone encountering a problem scans the code with their smartphone. They land on a public, asset-specific reporting page—no app or login required.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center text-2xl font-mono font-bold">03</div>
              <h3 className="text-2xl font-bold">AI Triage & Fix</h3>
              <p className="text-muted-foreground leading-relaxed">
                The report is instantly processed by our AI to suggest priority and diagnostic checks. Technicians are dispatched to resolve the issue with full context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8">Built for people who fix things for a living.</h2>
              
              <ul className="space-y-8">
                <li className="flex gap-4">
                  <div className="mt-1 bg-background border border-border p-2 self-start text-primary">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Client-Side QR Generation</h4>
                    <p className="text-muted-foreground">Download or print high-quality QR codes directly from the dashboard. Instantly connect physical assets to digital records.</p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="mt-1 bg-background border border-border p-2 self-start text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">AI-Assisted Triage</h4>
                    <p className="text-muted-foreground">Before a report is submitted, our AI analyzes the description to suggest priority levels, potential causes, and safety notes.</p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="mt-1 bg-background border border-border p-2 self-start text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Immutable Audit Trails</h4>
                    <p className="text-muted-foreground">Every status change, maintenance log, and assignment is permanently recorded. Complete visibility into the lifecycle of every asset.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-card border shadow-xl p-8 relative">
              <div className="absolute top-0 right-0 p-4 font-mono text-xs text-muted-foreground">PREVIEW</div>
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <div className="text-xs font-mono text-primary mb-1">ISSUE-0492</div>
                    <div className="text-xl font-bold">HVAC Chiller Vibration</div>
                  </div>
                  <div className="bg-warning text-warning-foreground px-2 py-1 text-xs font-mono uppercase">Medium</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground mb-1">ASSET</div>
                    <div className="font-medium">Roof Chiller Unit B (CH-02)</div>
                  </div>
                  
                  <div className="bg-muted p-4 border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                      <Activity className="h-4 w-4" /> AI Diagnostics
                    </div>
                    <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                      <li>Check bearing wear on primary fan</li>
                      <li>Inspect mounting bolt tension</li>
                      <li>Verify coolant pressure levels</li>
                    </ul>
                  </div>
                  
                  <Button className="w-full" variant="outline">ASSIGN TECHNICIAN</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}