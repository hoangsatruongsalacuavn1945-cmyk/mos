/**
 * Client-side Feedback & Web Rating Service
 * Communicates with /api/feedback and syncs with Google Sheets.
 */

import { backupFeedbackToGoogleSheet } from './googleSheetsService';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';

export interface FeedbackSubmission {
  userId?: string;
  userName?: string;
  userEmail?: string;
  rating: number; // 1 to 5
  category: 'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request' | 'other';
  title: string;
  description: string;
  deviceInfo?: string;
  screenResolution?: string;
  pageUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface FeedbackReportItem {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  rating: number;
  category: 'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request' | 'other';
  title: string;
  description: string;
  deviceInfo?: string;
  screenResolution?: string;
  pageUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  total: number;
  avgRating: number;
  pendingCount: number;
  resolvedCount: number;
  bugsCount: number;
  screenDisplayCount: number;
}

export class FeedbackClientService {
  /**
   * Submit feedback / bug report / web rating
   */
  public async submitFeedback(payload: FeedbackSubmission): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gửi phản hồi thất bại');
      }

      // Also dual-write to Google Sheets if connected
      const sheetsState = useGoogleSheetsStore.getState();
      if (sheetsState.isConnected && data.feedback) {
        backupFeedbackToGoogleSheet({
          id: data.feedback.id,
          userName: data.feedback.userName,
          userEmail: data.feedback.userEmail,
          category: data.feedback.category,
          rating: data.feedback.rating,
          title: data.feedback.title,
          description: data.feedback.description,
          deviceInfo: data.feedback.deviceInfo,
          screenResolution: data.feedback.screenResolution,
          pageUrl: data.feedback.pageUrl,
          priority: data.feedback.priority,
          status: data.feedback.status,
          adminNotes: data.feedback.adminNotes,
        }).catch(err => console.warn('Background feedback sheet sync error:', err));
      }

      return { success: true, data: data.feedback };
    } catch (err: any) {
      console.warn('Feedback API call failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all feedback for Owner / Admin portal
   */
  public async getFeedbackList(params: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<FeedbackReportItem[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', params.status);
      if (params.category) searchParams.set('category', params.category);
      if (params.search) searchParams.set('search', params.search);
      if (params.limit) searchParams.set('limit', String(params.limit));

      const res = await fetch(`/api/feedback?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Không thể tải danh sách phản hồi');

      const data = await res.json();
      return data.feedback || [];
    } catch (err: any) {
      console.warn('Error fetching feedback list:', err);
      return [];
    }
  }

  /**
   * Get feedback overview stats
   */
  public async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const res = await fetch('/api/feedback/stats');
      if (!res.ok) throw new Error('Không thể tải thống kê');
      const data = await res.json();
      return data.stats;
    } catch (err) {
      return {
        total: 0,
        avgRating: 5,
        pendingCount: 0,
        resolvedCount: 0,
        bugsCount: 0,
        screenDisplayCount: 0,
      };
    }
  }

  /**
   * Update feedback status (for Owner)
   */
  public async updateStatus(
    id: string,
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Error updating feedback status:', err);
      return false;
    }
  }

  /**
   * Delete feedback (for Owner)
   */
  public async deleteFeedback(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.warn('Error deleting feedback:', err);
      return false;
    }
  }
}

export const feedbackClientService = new FeedbackClientService();
