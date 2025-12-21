import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteAccountDialogProps {
  onDeleted: () => void;
}

const DeleteAccountDialog = ({ onDeleted }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Schedule deletion for 30 days from now
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ scheduled_deletion_at: deletionDate.toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Send deletion scheduled email
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'deletion_scheduled',
            userId: user.id
          }
        });
      } catch (emailError) {
        console.log('Email notification not sent');
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      toast.success('Account scheduled for deletion in 30 days');
      setOpen(false);
      onDeleted();
    } catch (error: any) {
      console.error('Error scheduling deletion:', error);
      toast.error(error.message || 'Failed to schedule account deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Your account will be scheduled for deletion. After 30 days, all your data 
              will be permanently deleted including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Your profile information</li>
              <li>All food entries and nutrition logs</li>
              <li>Your progress and streak data</li>
              <li>All notifications</li>
            </ul>
            <p className="font-medium text-foreground">
              If you log in within 30 days, you can recover your account.
            </p>
            <div className="pt-2">
              <p className="text-sm mb-2">Type <strong>DELETE</strong> to confirm:</p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="uppercase"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'DELETE' || isDeleting}
          >
            {isDeleting ? 'Processing...' : 'Delete Account'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;