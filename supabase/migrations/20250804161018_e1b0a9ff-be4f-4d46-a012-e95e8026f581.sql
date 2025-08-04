-- Create messages table for chat functionality
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in their transactions" 
ON public.messages 
FOR SELECT 
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = transaction_id 
    AND (owner_id = auth.uid() OR borrower_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages in their transactions" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = transaction_id 
    AND (owner_id = auth.uid() OR borrower_id = auth.uid())
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();