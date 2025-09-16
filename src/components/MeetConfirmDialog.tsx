import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';

interface MeetConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  otherUserName: string;
  bookTitle: string;
}

export const MeetConfirmDialog: React.FC<MeetConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  otherUserName,
  bookTitle
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            만남 확인
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <Clock className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">만남을 확인하시겠습니까?</h3>
            <p className="text-muted-foreground">
              <span className="font-medium">{otherUserName}</span>님과 
              <span className="font-medium"> "{bookTitle}"</span> 거래를 위해 만났음을 확인합니다.
            </p>
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 양쪽 모두 만남을 확인해야 거래가 진행됩니다.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            만남 확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};