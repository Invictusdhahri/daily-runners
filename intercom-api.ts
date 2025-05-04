import fetch from 'node-fetch';

export interface IntercomUser {
  id: string;
  type: 'user';
  email?: string;
}

export interface IntercomAdmin {
  id: string;
  type: 'admin';
}

export class IntercomApi {
  private readonly token: string;
  private readonly adminId: string;
  private readonly baseUrl = 'https://api.intercom.io';
  private rateLimitDelay = 50; // ms between requests to avoid rate limiting

  constructor(token: string, adminId: string) {
    if (!token) throw new Error('Intercom token is required');
    if (!adminId) throw new Error('Admin ID is required');
    
    this.token = token;
    this.adminId = adminId;
  }

  /**
   * Send an in-app message to a single user
   */
  async sendInAppMessage(userId: string, body: string): Promise<any> {
    const url = `${this.baseUrl}/messages`;
    const payload = {
      message_type: 'inapp',
      body,
      from: { type: 'admin', id: this.adminId },
      to: { type: 'user', id: userId }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Intercom API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * List all users from Intercom, with pagination support
   */
  async listAllUsers(): Promise<IntercomUser[]> {
    let allUsers: IntercomUser[] = [];
    let nextPageUrl = `${this.baseUrl}/contacts?type=user`;

    while (nextPageUrl) {
      try {
        console.log(`Fetching users page: ${nextPageUrl}`);
        const response = await fetch(nextPageUrl, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Intercom API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Add users from current page
        const users = data.data
          .filter((contact: any) => contact.type === 'user')
          .map((user: any) => ({
            id: user.id,
            type: 'user',
            email: user.email
          }));
        
        allUsers = [...allUsers, ...users];
        
        // Check if there's a next page - handle pagination properly
        nextPageUrl = '';
        
        if (data.pages && typeof data.pages.next === 'string') {
          // If it's already a full URL, use it directly
          if (data.pages.next.startsWith('http')) {
            nextPageUrl = data.pages.next;
          } 
          // If it's a relative path, append to base URL
          else if (data.pages.next.startsWith('/')) {
            nextPageUrl = `${this.baseUrl}${data.pages.next}`;
          }
          
          console.log(`Next page URL: ${nextPageUrl || 'None'}`);
        }
        
        // Add delay to avoid rate limiting
        if (nextPageUrl) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }

    return allUsers;
  }
} 