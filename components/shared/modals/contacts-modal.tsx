import { Mail, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface Contact {
  name: string;
  email: string;
  phone?: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  contacts: Contact[];
}

export function ContactsModal({ isOpen, onClose, entityName, contacts }: ContactsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>POS Contacts</CardTitle>
              <CardDescription>{entityName}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.map((contact, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {contact.email}
              </p>
              {contact.phone && (
                <p className="text-sm text-muted-foreground mt-1">{contact.phone}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
