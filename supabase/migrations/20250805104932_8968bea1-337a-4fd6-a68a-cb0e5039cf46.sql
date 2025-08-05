-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Enable realtime for transactions table
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.transactions;