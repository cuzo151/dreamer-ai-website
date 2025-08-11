import { apiClient, ApiResponse, PaginatedResponse, AuthTokens } from './apiClient';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'visitor' | 'client' | 'admin' | 'super_admin';
  emailVerified: boolean;
}

export interface UserProfile extends User {
  company?: string;
  phone?: string;
  jobTitle?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
}

export interface ServiceDetail extends Service {
  features: string[];
  pricing: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  consultationType: 'discovery' | 'technical' | 'strategy' | 'implementation' | 'support';
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  durationMinutes: number;
}

export interface BookingDetail extends Booking {
  meetingLink?: string;
  notes?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  message?: string;
  inquiryType?: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted' | 'lost';
  source: 'website' | 'referral' | 'social_media' | 'event' | 'direct' | 'other';
  createdAt: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  clientName?: string;
  industry?: string;
  challenge: string;
  solution: string;
  results: string;
  technologies: string[];
  metrics: Record<string, any>;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientTitle?: string;
  clientCompany?: string;
  clientImage?: string;
  content: string;
  rating?: number;
  isFeatured: boolean;
  isActive: boolean;
}

export interface ChatConversation {
  id: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  eventType: string;
  pageUrl?: string;
  properties?: Record<string, any>;
}

// Authentication Service
export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    return apiClient.post('/auth/register', data);
  },

  async login(email: string, password: string): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    return apiClient.post('/auth/login', { email, password });
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/password-reset', { email });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put(`/auth/password-reset/${token}`, { password });
  },

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string; email: string }>> {
    return apiClient.get(`/auth/verify-email/${token}`);
  },
};

// User Service
export const userService = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get('/users/profile');
  },

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put('/users/profile', data);
  },

  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiClient.delete('/users/profile');
  },

  // Admin endpoints
  async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  }): Promise<PaginatedResponse<User>> {
    return apiClient.getPaginated('/users', params);
  },

  async getUser(id: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.get(`/users/${id}`);
  },

  async updateUser(id: string, data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put(`/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/users/${id}`);
  },
};

// Services Service
export const servicesService = {
  async list(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Service>> {
    return apiClient.getPaginated('/services', params);
  },

  async get(slug: string): Promise<ApiResponse<ServiceDetail>> {
    return apiClient.get(`/services/${slug}`);
  },

  async create(data: {
    name: string;
    slug: string;
    description: string;
    features?: string[];
    pricing?: Record<string, any>;
    durationMinutes: number;
    isActive?: boolean;
  }): Promise<ApiResponse<ServiceDetail>> {
    return apiClient.post('/services', data);
  },

  async update(id: string, data: Partial<ServiceDetail>): Promise<ApiResponse<ServiceDetail>> {
    return apiClient.put(`/services/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/services/${id}`);
  },
};

// Bookings Service
export const bookingsService = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Booking>> {
    return apiClient.getPaginated('/bookings', params);
  },

  async get(id: string): Promise<ApiResponse<BookingDetail>> {
    return apiClient.get(`/bookings/${id}`);
  },

  async create(data: {
    serviceId: string;
    consultationType: string;
    scheduledAt: string;
    notes?: string;
  }): Promise<ApiResponse<BookingDetail>> {
    return apiClient.post('/bookings', data);
  },

  async update(id: string, data: Partial<BookingDetail>): Promise<ApiResponse<BookingDetail>> {
    return apiClient.put(`/bookings/${id}`, data);
  },

  async cancel(id: string, reason?: string): Promise<ApiResponse<BookingDetail>> {
    return apiClient.post(`/bookings/${id}/cancel`, { reason });
  },

  async confirm(id: string): Promise<ApiResponse<BookingDetail>> {
    return apiClient.post(`/bookings/${id}/confirm`);
  },

  async getAvailability(serviceId: string, date: string): Promise<ApiResponse<string[]>> {
    return apiClient.get('/bookings/availability', {
      params: { serviceId, date },
    });
  },
};

// Leads Service
export const leadsService = {
  async submitContact(data: {
    name: string;
    email: string;
    company?: string;
    message: string;
    type?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/contact/submit', data);
  },

  async subscribe(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/newsletter/subscribe', { email });
  },

  async unsubscribe(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/newsletter/unsubscribe/${token}`);
  },

  // Admin endpoints
  async listLeads(params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
  }): Promise<PaginatedResponse<Lead>> {
    return apiClient.getPaginated('/leads', params);
  },

  async getLead(id: string): Promise<ApiResponse<Lead>> {
    return apiClient.get(`/leads/${id}`);
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return apiClient.put(`/leads/${id}`, data);
  },

  async updateLeadStatus(id: string, status: string): Promise<ApiResponse<Lead>> {
    return apiClient.put(`/leads/${id}/status`, { status });
  },

  async assignLead(id: string, userId: string): Promise<ApiResponse<Lead>> {
    return apiClient.post(`/leads/${id}/assign`, { userId });
  },
};

// Case Studies Service
export const caseStudiesService = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<CaseStudy>> {
    return apiClient.getPaginated('/case-studies', params);
  },

  async get(slug: string): Promise<ApiResponse<CaseStudy>> {
    return apiClient.get(`/case-studies/${slug}`);
  },

  async create(data: Partial<CaseStudy>): Promise<ApiResponse<CaseStudy>> {
    return apiClient.post('/case-studies', data);
  },

  async update(id: string, data: Partial<CaseStudy>): Promise<ApiResponse<CaseStudy>> {
    return apiClient.put(`/case-studies/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/case-studies/${id}`);
  },

  async publish(id: string): Promise<ApiResponse<CaseStudy>> {
    return apiClient.post(`/case-studies/${id}/publish`);
  },
};

// Testimonials Service
export const testimonialsService = {
  async list(params?: {
    page?: number;
    limit?: number;
    isFeatured?: boolean;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Testimonial>> {
    return apiClient.getPaginated('/testimonials', params);
  },

  async get(id: string): Promise<ApiResponse<Testimonial>> {
    return apiClient.get(`/testimonials/${id}`);
  },

  async create(data: Partial<Testimonial>): Promise<ApiResponse<Testimonial>> {
    return apiClient.post('/testimonials', data);
  },

  async update(id: string, data: Partial<Testimonial>): Promise<ApiResponse<Testimonial>> {
    return apiClient.put(`/testimonials/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/testimonials/${id}`);
  },
};

// Chat Service
export const chatService = {
  async listConversations(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ChatConversation>> {
    return apiClient.getPaginated('/chat/conversations', params);
  },

  async getConversation(id: string): Promise<ApiResponse<ChatConversation & { messages: ChatMessage[] }>> {
    return apiClient.get(`/chat/conversations/${id}`);
  },

  async createConversation(title?: string): Promise<ApiResponse<ChatConversation>> {
    return apiClient.post('/chat/conversations', { title });
  },

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/chat/conversations/${id}`);
  },

  async sendMessage(data: {
    conversationId?: string;
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
  }): Promise<ApiResponse<{
    conversationId: string;
    message: ChatMessage;
    tokensUsed: number;
    model: string;
  }>> {
    return apiClient.post('/chat/completions', data);
  },

  async getModels(): Promise<ApiResponse<string[]>> {
    return apiClient.get('/chat/models');
  },
};

// Analytics Service
export const analyticsService = {
  async trackEvent(event: AnalyticsEvent): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/analytics/events', event);
  },

  async getDashboard(): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/dashboard');
  },

  async getUsersReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/reports/users', { params });
  },

  async getConversionsReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/reports/conversions', { params });
  },

  async getRevenueReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/reports/revenue', { params });
  },
};

// Admin Service
export const adminService = {
  async getStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/admin/stats');
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    entityType?: string;
    action?: string;
  }): Promise<PaginatedResponse<any>> {
    return apiClient.getPaginated('/admin/audit-logs', params);
  },

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return apiClient.get('/admin/system-health');
  },
};