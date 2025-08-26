import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface MeetConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  otherUserName: string;
  isInitiator: boolean;
}

export const MeetConfirmDialog: React.FC<MeetConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  otherUserName,
  isInitiator
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isInitiator ? "만남을 요청했습니다" : `${otherUserName}님이 만남을 요청했습니다`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isInitiator 
              ? `${otherUserName}님의 확인을 기다리고 있습니다. 실제로 만나셨다면 확인 버튼을 눌러주세요.`
              : `실제로 ${otherUserName}님과 만나셨다면 확인 버튼을 눌러주세요.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};