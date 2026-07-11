import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  Plus, 
  Copy, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  QrCode as QrCodeIcon,
  CheckCircle2,
  CalendarDays,
  MousePointerClick
} from "lucide-react";
import { 
  useListLinks, 
  useCreateLink, 
  useUpdateLink, 
  useDeleteLink,
  getListLinksQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Links() {
  const queryClient = useQueryClient();
  const { data: links, isLoading } = useListLinks();
  
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editLink, setEditLink] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredLinks = links?.filter(link => 
    link.title?.toLowerCase().includes(search.toLowerCase()) || 
    link.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
    link.originalUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <p className="text-muted-foreground">Manage your shortened URLs and aliases.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Link
        </Button>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Search links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-card"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-[300px]">Link</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredLinks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {search ? "No links match your search." : "You haven't created any links yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredLinks?.map((link) => (
                <LinkRow 
                  key={link.id} 
                  link={link} 
                  onEdit={() => setEditLink(link)}
                  onDelete={() => setDeleteId(link.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateLinkDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editLink && (
        <EditLinkDialog 
          link={editLink} 
          open={!!editLink} 
          onOpenChange={(open) => !open && setEditLink(null)} 
        />
      )}
      <DeleteLinkDialog 
        id={deleteId} 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
      />
    </div>
  );
}

function LinkRow({ link, onEdit, onDelete }: { link: any, onEdit: () => void, onDelete: () => void }) {
  const updateLink = useUpdateLink();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleEnabled = () => {
    updateLink.mutate({ id: link.id, data: { isEnabled: !link.isEnabled } }, {
      onSuccess: () => {
        toast.success(link.isEnabled ? "Link disabled" : "Link enabled");
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
      }
    });
  };

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{link.title || link.shortCode}</span>
          <div className="flex items-center gap-2 text-sm">
            <a 
              href={link.shortUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono"
            >
              {link.shortUrl.replace(/^https?:\/\//, '')}
            </a>
            <button 
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 max-w-[300px]">
          <span className="text-muted-foreground truncate text-sm" title={link.originalUrl}>
            {link.originalUrl}
          </span>
          <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5 font-medium">
          <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
          {link.stats.humanClicks.toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch 
            checked={link.isEnabled} 
            onCheckedChange={toggleEnabled} 
            disabled={updateLink.isPending}
            className="scale-75 origin-left"
          />
          <Badge variant={link.isEnabled ? "outline" : "secondary"} className={link.isEnabled ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" : ""}>
            {link.isEnabled ? "Active" : "Disabled"}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Link
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/qr-codes`} className="cursor-pointer w-full">
                <QrCodeIcon className="mr-2 h-4 w-4" />
                QR Code
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function CreateLinkDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const createLink = useCreateLink();
  
  const [originalUrl, setOriginalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLink.mutate(
      { data: { 
        originalUrl, 
        title: title || undefined, 
        customAlias: customAlias || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
      } },
      {
        onSuccess: () => {
          toast.success("Link created successfully!");
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          setOriginalUrl("");
          setTitle("");
          setCustomAlias("");
          setExpiresAt("");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.error || "Failed to create link");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Short Link</DialogTitle>
            <DialogDescription>
              Create a new shortened link to track human clicks and bot traffic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Destination URL <span className="text-destructive">*</span></Label>
              <Input
                id="url"
                placeholder="https://example.com/long-url-to-shorten"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                type="url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Campaign Link 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alias">Custom Alias (Optional)</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground text-sm">
                  {window.location.host}/s/
                </span>
                <Input
                  id="alias"
                  placeholder="my-campaign"
                  className="rounded-l-none"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expires">Expiration Date (Optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createLink.isPending}>
              {createLink.isPending ? "Creating..." : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditLinkDialog({ link, open, onOpenChange }: { link: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const updateLink = useUpdateLink();
  
  const [originalUrl, setOriginalUrl] = useState(link.originalUrl);
  const [title, setTitle] = useState(link.title || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLink.mutate(
      { id: link.id, data: { 
        originalUrl, 
        title: title || null
      } },
      {
        onSuccess: () => {
          toast.success("Link updated successfully!");
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.error || "Failed to update link");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              Make changes to your shortened link. The custom alias cannot be changed once created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-url">Destination URL</Label>
              <Input
                id="edit-url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                type="url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateLink.isPending}>
              {updateLink.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteLinkDialog({ id, open, onOpenChange }: { id: number | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const deleteLink = useDeleteLink();

  const confirmDelete = () => {
    if (!id) return;
    deleteLink.mutate({ id }, {
      onSuccess: () => {
        toast.success("Link deleted forever");
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        onOpenChange(false);
      },
      onError: (err: any) => toast.error(err?.error || "Failed to delete link")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your short link
            and remove all associated analytics data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={deleteLink.isPending}>
            {deleteLink.isPending ? "Deleting..." : "Delete Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}