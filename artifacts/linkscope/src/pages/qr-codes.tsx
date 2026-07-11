import { useState } from "react";
import { useListLinks, useGetLinkQrCode } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, QrCode } from "lucide-react";

export default function QrCodes() {
  const { data: links, isLoading } = useListLinks();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
        <p className="text-muted-foreground">Download print-ready QR codes for your active links.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-4">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Skeleton className="w-full aspect-square rounded-lg mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))
        ) : links?.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <QrCode className="h-12 w-12 mb-4 text-muted" />
            <p>No links found.</p>
            <p className="text-sm">Create a link first to generate a QR code.</p>
          </div>
        ) : (
          links?.filter(l => l.isEnabled).map((link) => (
            <QrCodeCard key={link.id} link={link} />
          ))
        )}
      </div>
    </div>
  );
}

function QrCodeCard({ link }: { link: any }) {
  const { data: qr, isLoading } = useGetLinkQrCode(link.id);

  const handleDownload = () => {
    if (!qr?.dataUrl) return;
    const a = document.createElement("a");
    a.href = qr.dataUrl;
    a.download = `qrcode-${link.shortCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="shadow-sm border-border/60 overflow-hidden group hover:border-primary/30 transition-colors">
      <CardHeader className="pb-4 pt-5 px-5 bg-muted/20 border-b border-border/50">
        <CardTitle className="text-base truncate" title={link.title || link.shortCode}>
          {link.title || link.shortCode}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs truncate">
          <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            {link.shortUrl.replace(/^https?:\/\//, '')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 flex flex-col items-center">
        <div className="w-full aspect-square bg-white rounded-xl mb-5 border border-border/50 flex items-center justify-center p-4 relative">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : qr ? (
            <img 
              src={qr.dataUrl} 
              alt={`QR code for ${link.shortUrl}`} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center">Failed to load</div>
          )}
        </div>
        <Button 
          variant="secondary" 
          className="w-full shadow-sm bg-primary/10 text-primary hover:bg-primary/20" 
          onClick={handleDownload}
          disabled={!qr || isLoading}
        >
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
      </CardContent>
    </Card>
  );
}