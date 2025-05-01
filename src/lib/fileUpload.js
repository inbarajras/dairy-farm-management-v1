// src/lib/fileUpload.js

import { v4 as uuidv4 } from 'uuid';
import supabase from './supabase';

/**
 * Uploads a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - The folder within the bucket
 * @returns {Promise<string>} - URL of the uploaded file
 */
export const uploadFile = async (file, bucket = 'cow-images', folder = 'cows') => {
  try {
    if (!file) return null;
    
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

/**
 * Deletes a file from Supabase Storage
 * @param {string} fileUrl - The full URL of the file to delete
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (fileUrl, bucket = 'cow-images') => {
  try {
    if (!fileUrl) return true;
    
    // Extract the path from the URL
    const urlObj = new URL(fileUrl);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');
    
    // Delete the file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};