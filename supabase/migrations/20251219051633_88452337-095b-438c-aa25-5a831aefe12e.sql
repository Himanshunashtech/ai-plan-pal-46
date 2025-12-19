-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true);

-- Storage policies for food images
CREATE POLICY "Users can view their own food images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own food images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own food images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);