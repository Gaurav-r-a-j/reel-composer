import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReplaceSceneDialogProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ReplaceSceneDialog: React.FC<ReplaceSceneDialogProps> = ({
  show,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={true}
        onEscapeKeyDown={onCancel}
        onPointerDownOutside={onCancel}
        className="max-w-md"
      >
        <DialogHeader>
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl shrink-0 bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle>Scene Generated</DialogTitle>
              <DialogDescription className="mt-0.5">
                The AI has finished generating your scene.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          A new scene has arrived from the background generation process. Would
          you like to replace your current manual setup with the AI-generated
          one?
        </p>

        <DialogFooter showCloseButton={false} className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Keep Manual
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            Replace Scene
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
