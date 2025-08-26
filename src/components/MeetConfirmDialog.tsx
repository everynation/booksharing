import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface MeetConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  otherUserName: string;
  isInitiator: boolean;
}

export const MeetConfirmDialog: React.FC<MeetConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  otherUserName,
  isInitiator
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            대여를 진행할까요?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isInitiator 
              ? `${otherUserName}님과 실제로 만나셨나요? 대여를 시작하시겠습니까?`
              : `${otherUserName}님과 실제로 만나셨나요? 대여를 시작하시겠습니까?`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel}>
            아니오
          </Button>
          <AlertDialogAction onClick={onConfirm}>
            예
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};