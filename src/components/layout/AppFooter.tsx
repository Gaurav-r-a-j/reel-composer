import React from 'react';
import { BookOpen, Github, Globe, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-muted w-full shrink-0">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6 py-8">
        <div className="flex items-center gap-6">
          <div className="size-14 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] shrink-0">
            <a href="https://prasannathapa.in" target="_blank" rel="noreferrer">
              <img
                src="https://blog.prasannathapa.in/content/images/2024/12/Picsart_24-12-18_08-13-50-070.jpg"
                alt="Prasanna Thapa"
                className="rounded-full w-full h-full object-cover bg-background"
              />
            </a>
          </div>
          <div>
            <div className="font-bold text-foreground text-lg">Prasanna Thapa</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Technical Architect</span>
              <span className="hidden md:inline w-px h-4 bg-border" aria-hidden />
              <a href="https://zoho.com" target="_blank" rel="noreferrer">
                <img
                  src="https://www.zohowebstatic.com/sites/default/files/zoho_general_pages/zoho-logo-white.png"
                  alt="Zoho"
                  className="h-5"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 items-center">
          <Button variant="secondary" size="sm" asChild className="rounded-full gap-2">
            <a href="https://blog.prasannathapa.in/reel-composer/" target="_blank" rel="noreferrer">
              <BookOpen className="size-3.5" /> The Philosophy
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full gap-2">
            <a href="https://github.com/prasannathapa/reel-composer" target="_blank" rel="noreferrer">
              <Github className="size-3.5" /> Source Code
            </a>
          </Button>
          <span className="hidden md:block w-px h-4 bg-border" aria-hidden />
          <a
            href="https://prasannathapa.in/"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Website"
          >
            <Globe className="size-5" />
          </a>
          <a
            href="https://github.com/prasannathapa"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub"
          >
            <Github className="size-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/prasannathapa"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="LinkedIn"
          >
            <Linkedin className="size-5" />
          </a>
          <a
            href="https://instagram.com/prasanna_thapa"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Instagram"
          >
            <Instagram className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};
