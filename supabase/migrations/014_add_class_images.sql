-- Add image_url column to classes table for custom event photos/flyers
ALTER TABLE classes ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for class images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-images', 'class-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to class images
CREATE POLICY "Public read access for class images"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-images');

-- Allow instructors to upload images
CREATE POLICY "Instructors can upload class images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'class-images' 
  AND auth.role() = 'authenticated'
);

-- Allow instructors to update their own images
CREATE POLICY "Instructors can update class images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'class-images' 
  AND auth.role() = 'authenticated'
);

-- Allow instructors to delete their own images
CREATE POLICY "Instructors can delete class images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'class-images' 
  AND auth.role() = 'authenticated'
);
