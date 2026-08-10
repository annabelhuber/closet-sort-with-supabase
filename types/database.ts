export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      upload_sessions: {
        Row: {
          id: string;
          user_id: string;
          source_image_path: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_image_path?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_image_path?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      processing_jobs: {
        Row: {
          id: string;
          upload_session_id: string;
          detected_item_id: string | null;
          user_id: string;
          job_type: string;
          status: string;
          payload: Json | null;
          result: Json | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          upload_session_id: string;
          detected_item_id?: string | null;
          user_id: string;
          job_type: string;
          status?: string;
          payload?: Json | null;
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          upload_session_id?: string;
          detected_item_id?: string | null;
          user_id?: string;
          job_type?: string;
          status?: string;
          payload?: Json | null;
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      detected_items: {
        Row: {
          id: string;
          upload_session_id: string;
          user_id: string;
          processed_image_path: string;
          suggested_category: string | null;
          suggested_color: string | null;
          detection_confidence: number | null;
          name: string | null;
          brand: string | null;
          size: string | null;
          color: string | null;
          category: string | null;
          notes: string | null;
          location: string | null;
          laundry: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          upload_session_id: string;
          user_id: string;
          processed_image_path: string;
          suggested_category?: string | null;
          suggested_color?: string | null;
          detection_confidence?: number | null;
          name?: string | null;
          brand?: string | null;
          size?: string | null;
          color?: string | null;
          category?: string | null;
          notes?: string | null;
          location?: string | null;
          laundry?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          upload_session_id?: string;
          user_id?: string;
          processed_image_path?: string;
          suggested_category?: string | null;
          suggested_color?: string | null;
          detection_confidence?: number | null;
          name?: string | null;
          brand?: string | null;
          size?: string | null;
          color?: string | null;
          category?: string | null;
          notes?: string | null;
          location?: string | null;
          laundry?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clothing_items: {
        Row: {
          id: string;
          user_id: string;
          detected_item_id: string | null;
          display_image_path: string;
          name: string | null;
          brand: string | null;
          size: string | null;
          color: string | null;
          category: string | null;
          notes: string | null;
          location: string | null;
          laundry: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          detected_item_id?: string | null;
          display_image_path: string;
          name?: string | null;
          brand?: string | null;
          size?: string | null;
          color?: string | null;
          category?: string | null;
          notes?: string | null;
          location?: string | null;
          laundry?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          detected_item_id?: string | null;
          display_image_path?: string;
          name?: string | null;
          brand?: string | null;
          size?: string | null;
          color?: string | null;
          category?: string | null;
          notes?: string | null;
          location?: string | null;
          laundry?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type UploadSession = Database["public"]["Tables"]["upload_sessions"]["Row"];
export type ProcessingJob = Database["public"]["Tables"]["processing_jobs"]["Row"];
export type DetectedItem = Database["public"]["Tables"]["detected_items"]["Row"];
export type ClothingItem = Database["public"]["Tables"]["clothing_items"]["Row"];
