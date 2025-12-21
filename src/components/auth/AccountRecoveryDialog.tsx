import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface AccountRecoveryDialogProps {
  open: boolean;
  deletionDate: string;
  onKeepAccount: () => void;
  onGoBack: () => void;
  isLoading?: boolean;
}

const AccountRecoveryDialog = ({
  open,
  deletionDate,
  onKeepAccount,
  onGoBack,
  isLoading = false,
}: AccountRecoveryDialogProps) => {
  const formattedDate = deletionDate ? format(new Date(deletionDate), 'MMMM d, yyyy') : '';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Account Scheduled for Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Your account is currently scheduled for permanent deletion on{' '}
              <strong className="text-foreground">{formattedDate}</strong>.
            </p>
            <p>
              Would you like to keep your account and restore all your data, or go back to the login page?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onGoBack} disabled={isLoading}>
            Go Back to Login
          </AlertDialogCancel>
          <AlertDialogAction onClick={onKeepAccount} disabled={isLoading}>
            {isLoading ? 'Restoring...' : 'Keep My Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AccountRecoveryDialog;